import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? 'https://fre-analytics-castletaek9643-9522s-projects.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Cache-Control': 'no-store',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ===== SQL Injection Prevention =====
const SQL_BLOCKED_KEYWORDS = /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|GRANT|REVOKE|MERGE|REPLACE|CALL|LOAD|COPY|SET|RESET|VACUUM|REINDEX|CLUSTER|COMMENT|LOCK|UNLOCK)\b/i;
const SQL_COMMENT_PATTERN = /(--|\/\*|\*\/|#)/;
const SQL_MULTI_STATEMENT = /;[\s]*\S/;

function validateSQLQuery(query: string): { valid: boolean; error?: string } {
  const trimmed = query.trim();

  if (!trimmed) {
    return { valid: false, error: 'Query cannot be empty' };
  }

  // Must start with SELECT or WITH (CTE)
  if (!/^\s*(SELECT|WITH)\b/i.test(trimmed)) {
    return { valid: false, error: 'Only SELECT queries are allowed' };
  }

  // Block SQL comments (potential bypass vectors)
  if (SQL_COMMENT_PATTERN.test(trimmed)) {
    return { valid: false, error: 'SQL comments are not allowed' };
  }

  // Block multi-statement (semicolon followed by non-whitespace)
  if (SQL_MULTI_STATEMENT.test(trimmed)) {
    return { valid: false, error: 'Multiple SQL statements are not allowed' };
  }

  // Block dangerous keywords
  // Remove string literals first to avoid false positives
  const withoutStrings = trimmed.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
  if (SQL_BLOCKED_KEYWORDS.test(withoutStrings)) {
    const match = withoutStrings.match(SQL_BLOCKED_KEYWORDS);
    return { valid: false, error: `Forbidden SQL keyword: ${match?.[1]?.toUpperCase()}` };
  }

  return { valid: true };
}

function validatePropertyId(propertyId: string): boolean {
  return /^\d{1,20}$/.test(propertyId);
}

const MAX_CONNECTOR_ROWS = 100_000;

function clampLimit(rawLimit: unknown): number {
  const parsed = Number(rawLimit);
  if (!Number.isFinite(parsed)) return MAX_CONNECTOR_ROWS;
  return Math.min(Math.max(Math.floor(parsed), 1), MAX_CONNECTOR_ROWS);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const isServiceRole = serviceRoleKey.length > 0 && token === serviceRoleKey;

  const userClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    { global: { headers: { Authorization: authHeader } } }
  );

  let userId: string | null = null;
  if (!isServiceRole) {
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid authentication' }, 401);
    }
    userId = user.id;
  }

  const serviceClient = isServiceRole
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

  try {
    const body = await req.json() as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : '';
    const connectorId = typeof body.connectorId === 'string' ? body.connectorId : '';
    const type = typeof body.type === 'string' ? body.type : '';
    const config = (body.config ?? null) as Record<string, unknown> | null;
    const rawDateRange = (body.dateRange ?? null) as Record<string, unknown> | null;
    const dateRange = rawDateRange
      && typeof rawDateRange.from === 'string'
      && typeof rawDateRange.to === 'string'
      ? { from: rawDateRange.from, to: rawDateRange.to }
      : undefined;
    const limit = clampLimit(body.limit);

    if (!action || !['test', 'fetch'].includes(action)) {
      return jsonResponse({ error: 'Invalid action. Use "test" or "fetch".' }, 400);
    }

    // Service-role calls are internal only and must reference a saved connector.
    if (isServiceRole && !connectorId) {
      return jsonResponse({ error: 'connectorId is required for internal calls' }, 400);
    }

    // Resolve connector config: either from DB (connectorId) or inline (config)
    let connectorType = type;
    let connectorConfig = config;
    let connectorOwnerId = userId;

    if (connectorId) {
      if (isServiceRole && serviceClient) {
        const { data: connector, error: connErr } = await serviceClient
          .from('fre_connectors')
          .select('id, user_id, type, config')
          .eq('id', connectorId)
          .single();

        if (connErr || !connector) {
          return jsonResponse({ error: 'Connector not found' }, 404);
        }

        connectorType = connector.type;
        connectorConfig = connector.config as Record<string, unknown>;
        connectorOwnerId = connector.user_id as string;
      } else {
        if (!userId) {
          return jsonResponse({ error: 'Invalid authentication' }, 401);
        }

        const { data: connector, error: connErr } = await userClient
          .from('fre_connectors')
          .select('id, user_id, type, config')
          .eq('id', connectorId)
          .eq('user_id', userId)
          .single();

        if (connErr || !connector) {
          return jsonResponse({ error: 'Connector not found' }, 404);
        }

        connectorType = connector.type;
        connectorConfig = connector.config as Record<string, unknown>;
        connectorOwnerId = connector.user_id as string;
      }
    }

    if (!connectorType) {
      return jsonResponse({ error: 'Connector type is required' }, 400);
    }
    if (!connectorConfig) {
      return jsonResponse({ error: 'Connector config is required' }, 400);
    }

    let plan = 'free';
    if (connectorOwnerId) {
      const planClient = isServiceRole && serviceClient ? serviceClient : userClient;
      const { data: profile } = await planClient
        .from('fre_user_profiles')
        .select('plan')
        .eq('id', connectorOwnerId)
        .single();
      plan = profile?.plan ?? 'free';
    }

    // Plan gate check
    const proTypes = ['ga4-api', 'mixpanel-api'];
    const enterpriseTypes = ['postgresql', 'mysql'];

    if (proTypes.includes(connectorType) && plan === 'free') {
      return jsonResponse({ error: 'Pro plan required for API connectors', code: 'CONN_PERMISSION' }, 403);
    }
    if (enterpriseTypes.includes(connectorType) && plan !== 'team') {
      return jsonResponse({ error: 'Team plan required for database connectors', code: 'CONN_PERMISSION' }, 403);
    }

    // Route to handler
    switch (connectorType) {
      case 'ga4-api':
        return await handleGA4(
          action,
          connectorConfig as { propertyId?: string; accessToken?: string; refreshToken?: string },
          dateRange,
          limit
        );
      case 'mixpanel-api':
        return await handleMixpanel(
          action,
          connectorConfig as { projectId?: string; apiSecret?: string },
          dateRange,
          limit
        );
      case 'postgresql':
        return await handlePostgreSQL(
          action,
          connectorConfig as {
            host?: string;
            port?: number;
            database?: string;
            username?: string;
            password?: string;
            ssl?: boolean;
            query?: string;
          },
          limit
        );
      case 'mysql':
        return await handleMySQL(
          action,
          connectorConfig as {
            host?: string;
            port?: number;
            database?: string;
            username?: string;
            password?: string;
            query?: string;
          },
          limit
        );
      default:
        return jsonResponse({ error: `Unsupported connector type: ${connectorType}` }, 400);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse({ error: message }, 500);
  }
});

// ===== GA4 API Handler =====
async function handleGA4(
  action: string,
  config: { propertyId?: string; accessToken?: string; refreshToken?: string },
  dateRange?: { from: string; to: string },
  limit?: number,
) {
  if (!config.propertyId || !config.accessToken) {
    return jsonResponse({ error: 'GA4 propertyId and accessToken are required' }, 400);
  }
  if (!validatePropertyId(config.propertyId)) {
    return jsonResponse({ error: 'Invalid GA4 propertyId: must be numeric' }, 400);
  }

  const from = dateRange?.from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = dateRange?.to ?? new Date().toISOString().slice(0, 10);

  const reportRequest = {
    dateRanges: [{ startDate: from, endDate: to }],
    dimensions: [
      { name: 'dateHour' },
      { name: 'eventName' },
      { name: 'sessionSource' },
      { name: 'platform' },
    ],
    metrics: [
      { name: 'eventCount' },
      { name: 'totalUsers' },
    ],
    limit: limit ?? 100_000,
  };

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:runReport`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportRequest),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return jsonResponse({ error: `GA4 API error (${res.status})` }, res.status);
  }

  const report = await res.json();

  if (action === 'test') {
    const rowCount = report.rows?.length ?? 0;
    return jsonResponse({ success: true, message: `Connected. ${rowCount} rows available.`, sampleRows: rowCount });
  }

  // Convert GA4 response to RawRow[]
  const headers = ['timestamp', 'event_name', 'source', 'platform', 'event_count', 'users'];
  const data = (report.rows ?? []).map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    timestamp: row.dimensionValues[0]?.value ?? '',
    event_name: row.dimensionValues[1]?.value ?? '',
    source: row.dimensionValues[2]?.value ?? '',
    platform: row.dimensionValues[3]?.value ?? '',
    event_count: row.metricValues[0]?.value ?? '0',
    users: row.metricValues[1]?.value ?? '0',
  }));

  return jsonResponse({
    data,
    headers,
    totalRows: data.length,
    truncated: data.length >= (limit ?? 100_000),
  });
}

// ===== Mixpanel API Handler =====
async function handleMixpanel(
  action: string,
  config: { projectId?: string; apiSecret?: string },
  dateRange?: { from: string; to: string },
  limit?: number,
) {
  if (!config.apiSecret) {
    return jsonResponse({ error: 'Mixpanel API secret is required' }, 400);
  }

  const from = dateRange?.from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = dateRange?.to ?? new Date().toISOString().slice(0, 10);

  const params = new URLSearchParams({
    from_date: from,
    to_date: to,
  });

  const url = `https://data.mixpanel.com/api/2.0/export?${params}`;
  const authToken = btoa(`${config.apiSecret}:`);

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${authToken}` },
  });

  if (!res.ok) {
    const errBody = await res.text();
    return jsonResponse({ error: `Mixpanel API error (${res.status})` }, res.status);
  }

  const text = await res.text();
  const lines = text.trim().split('\n').filter(Boolean);

  if (action === 'test') {
    return jsonResponse({ success: true, message: `Connected. ${lines.length} events available.`, sampleRows: lines.length });
  }

  // Parse JSONL format
  const maxRows = limit ?? 100_000;
  const data: Record<string, string>[] = [];
  const headerSet = new Set<string>();

  for (let i = 0; i < Math.min(lines.length, maxRows); i++) {
    try {
      const event = JSON.parse(lines[i]);
      const row: Record<string, string> = {
        event: event.event ?? '',
        distinct_id: event.properties?.distinct_id ?? '',
        time: event.properties?.time ? new Date(event.properties.time * 1000).toISOString() : '',
        ...(event.properties?.$browser ? { browser: event.properties.$browser } : {}),
        ...(event.properties?.$os ? { os: event.properties.$os } : {}),
      };
      Object.keys(row).forEach(k => headerSet.add(k));
      data.push(row);
    } catch {
      // skip malformed lines
    }
  }

  const headers = Array.from(headerSet);
  return jsonResponse({
    data,
    headers,
    totalRows: data.length,
    truncated: lines.length > maxRows,
  });
}

// ===== PostgreSQL Handler =====
async function handlePostgreSQL(
  action: string,
  config: { host?: string; port?: number; database?: string; username?: string; password?: string; ssl?: boolean; query?: string },
  limit?: number,
) {
  if (!config.host || !config.database || !config.username || !config.password) {
    return jsonResponse({ error: 'PostgreSQL connection details are required' }, 400);
  }
  if (!config.query) {
    return jsonResponse({ error: 'SQL query is required' }, 400);
  }

  // Use Deno postgres module
  const { Client } = await import('https://deno.land/x/postgres@v0.19.3/mod.ts');

  const client = new Client({
    hostname: config.host,
    port: config.port ?? 5432,
    database: config.database,
    user: config.username,
    password: config.password,
    tls: { enabled: config.ssl !== false },
  });

  try {
    await client.connect();

    if (action === 'test') {
      const result = await client.queryObject(`SELECT 1 as ok`);
      await client.end();
      return jsonResponse({ success: true, message: 'Connected successfully.', sampleRows: result.rows.length });
    }

    // Validate SQL query to prevent injection
    const validation = validateSQLQuery(config.query);
    if (!validation.valid) {
      await client.end();
      return jsonResponse({ error: validation.error, code: 'CONN_QUERY_REJECTED' }, 400);
    }

    // Add LIMIT to prevent huge result sets
    const maxRows = limit ?? 100_000;
    const safeQuery = config.query.replace(/;\s*$/, '');
    const limitedQuery = `SELECT * FROM (${safeQuery}) AS q LIMIT ${maxRows + 1}`;

    const result = await client.queryObject(limitedQuery);
    await client.end();

    const rows = result.rows as Record<string, unknown>[];
    const truncated = rows.length > maxRows;
    const data = rows.slice(0, maxRows).map(row => {
      const stringRow: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        stringRow[key] = val == null ? '' : String(val);
      }
      return stringRow;
    });

    const headers = result.columns?.map(c => c.name) ?? Object.keys(data[0] ?? {});

    return jsonResponse({ data, headers, totalRows: data.length, truncated });
  } catch (err) {
    try { await client.end(); } catch { /* ignore */ }
    const msg = err instanceof Error ? err.message : 'PostgreSQL query failed';
    return jsonResponse({ error: msg, code: 'CONN_QUERY_ERROR' }, 400);
  }
}

// ===== MySQL Handler =====
async function handleMySQL(
  action: string,
  config: { host?: string; port?: number; database?: string; username?: string; password?: string; query?: string },
  limit?: number,
) {
  if (!config.host || !config.database || !config.username || !config.password) {
    return jsonResponse({ error: 'MySQL connection details are required' }, 400);
  }
  if (!config.query) {
    return jsonResponse({ error: 'SQL query is required' }, 400);
  }

  const { Client } = await import('https://deno.land/x/mysql@v2.12.1/mod.ts');

  const client = await new Client().connect({
    hostname: config.host,
    port: config.port ?? 3306,
    db: config.database,
    username: config.username,
    password: config.password,
  });

  try {
    if (action === 'test') {
      await client.execute('SELECT 1 as ok');
      await client.close();
      return jsonResponse({ success: true, message: 'Connected successfully.', sampleRows: 1 });
    }

    // Validate SQL query to prevent injection
    const validation = validateSQLQuery(config.query);
    if (!validation.valid) {
      await client.close();
      return jsonResponse({ error: validation.error, code: 'CONN_QUERY_REJECTED' }, 400);
    }

    const maxRows = limit ?? 100_000;
    const safeQuery = config.query.replace(/;\s*$/, '');
    const limitedQuery = `SELECT * FROM (${safeQuery}) AS q LIMIT ${maxRows + 1}`;

    const result = await client.execute(limitedQuery);
    await client.close();

    const rows = (result.rows ?? []) as Record<string, unknown>[];
    const truncated = rows.length > maxRows;
    const data = rows.slice(0, maxRows).map(row => {
      const stringRow: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        stringRow[key] = val == null ? '' : String(val);
      }
      return stringRow;
    });

    const headers = result.fields?.map(f => f.name) ?? Object.keys(data[0] ?? {});

    return jsonResponse({ data, headers, totalRows: data.length, truncated });
  } catch (err) {
    try { await client.close(); } catch { /* ignore */ }
    const msg = err instanceof Error ? err.message : 'MySQL query failed';
    return jsonResponse({ error: msg, code: 'CONN_QUERY_ERROR' }, 400);
  }
}
