import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? 'https://fre-analytics-castletaek9643-9522s-projects.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAGE_SIZE = 20;

const ALLOWED_PLANS = ['free', 'pro'];
const ALLOWED_ROLES = ['user', 'admin'];

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ===== Handlers =====

async function handleStats(
  serviceClient: ReturnType<typeof createClient>
): Promise<Response> {
  // Total users
  const { count: totalUsers } = await serviceClient
    .from('fre_user_profiles')
    .select('*', { count: 'exact', head: true });

  // Pro users
  const { count: proUsers } = await serviceClient
    .from('fre_user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('plan', 'pro');

  // Today signups
  const today = new Date().toISOString().slice(0, 10);
  const { count: todaySignups } = await serviceClient
    .from('fre_user_profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today);

  // MRR: sum of active subscriptions
  const { data: activeProfiles } = await serviceClient
    .from('fre_user_profiles')
    .select('billing_cycle')
    .eq('plan', 'pro')
    .eq('subscription_status', 'active');

  let mrr = 0;
  for (const p of activeProfiles ?? []) {
    if (p.billing_cycle === 'annual') {
      mrr += 23200; // 278400 / 12
    } else {
      mrr += 29000;
    }
  }

  return jsonResponse({
    totalUsers: totalUsers ?? 0,
    proUsers: proUsers ?? 0,
    todaySignups: todaySignups ?? 0,
    mrr,
  });
}

async function handleUsers(
  serviceClient: ReturnType<typeof createClient>,
  url: URL
): Promise<Response> {
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const search = url.searchParams.get('search') ?? '';
  const planFilter = url.searchParams.get('plan') ?? '';

  // Get users from auth.admin
  const { data: authData, error: authError } = await serviceClient.auth.admin.listUsers({
    page,
    perPage: PAGE_SIZE,
  });

  if (authError) {
    return jsonResponse({ error: authError.message }, 500);
  }

  const authUsers = authData?.users ?? [];
  const totalFromAuth = authData?.total ?? 0;

  // Get all profiles for these users
  const userIds = authUsers.map((u) => u.id);
  const { data: profiles } = await serviceClient
    .from('fre_user_profiles')
    .select('id, role, plan, subscription_status, billing_cycle')
    .in('id', userIds.length > 0 ? userIds : ['__none__']);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let users = authUsers.map((u) => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? '',
      last_sign_in_at: u.last_sign_in_at ?? null,
      created_at: u.created_at,
      role: profile?.role ?? 'user',
      plan: profile?.plan ?? 'free',
      subscription_status: profile?.subscription_status ?? 'none',
      billing_cycle: profile?.billing_cycle ?? 'monthly',
    };
  });

  // Client-side filters (auth.admin.listUsers doesn't support email search or custom filters)
  if (search) {
    const q = search.toLowerCase();
    users = users.filter((u) => u.email.toLowerCase().includes(q));
  }
  if (planFilter) {
    users = users.filter((u) => u.plan === planFilter);
  }

  return jsonResponse({
    users,
    page,
    total: totalFromAuth,
  });
}

async function handleUserDetail(
  serviceClient: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  // 1. Auth user
  const { data: authData, error: authError } = await serviceClient.auth.admin.getUserById(userId);
  if (authError || !authData?.user) {
    return jsonResponse({ error: 'User not found' }, 404);
  }
  const authUser = authData.user;

  // 2. Profile
  const { data: profile } = await serviceClient
    .from('fre_user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // 3. Billing history (last 20)
  const { data: billing } = await serviceClient
    .from('fre_billing_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  // 4. Projects
  const { data: projects } = await serviceClient
    .from('fre_projects')
    .select('id, name, created_at')
    .eq('user_id', userId);

  return jsonResponse({
    user: {
      id: authUser.id,
      email: authUser.email ?? '',
      last_sign_in_at: authUser.last_sign_in_at ?? null,
      created_at: authUser.created_at,
    },
    profile: profile ?? {},
    billing: billing ?? [],
    projects: projects ?? [],
  });
}

async function handleUserUpdate(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  req: Request
): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.plan === 'string') {
    if (!ALLOWED_PLANS.includes(body.plan)) {
      return jsonResponse({ error: `Invalid plan. Allowed: ${ALLOWED_PLANS.join(', ')}` }, 400);
    }
    updates.plan = body.plan;
  }

  if (typeof body.role === 'string') {
    if (!ALLOWED_ROLES.includes(body.role)) {
      return jsonResponse({ error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}` }, 400);
    }
    updates.role = body.role;
  }

  if (Object.keys(updates).length === 0) {
    return jsonResponse({ error: 'No valid fields to update' }, 400);
  }

  const { error } = await serviceClient
    .from('fre_user_profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ success: true });
}

async function handleBilling(
  serviceClient: ReturnType<typeof createClient>,
  url: URL
): Promise<Response> {
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const statusFilter = url.searchParams.get('status') ?? '';

  let query = serviceClient
    .from('fre_billing_history')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, count, error } = await query;

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    records: data ?? [],
    page,
    total: count ?? 0,
  });
}

async function handleRevenue(
  serviceClient: ReturnType<typeof createClient>
): Promise<Response> {
  const { data, error } = await serviceClient.rpc('admin_monthly_revenue');

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ revenue: data ?? [] });
}

// ===== Main =====

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. Auth: extract JWT user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: 'Invalid authentication' }, 401);
  }

  // 2. Admin role check via service_role
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile } = await serviceClient
    .from('fre_user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return jsonResponse({ error: 'Admin access required' }, 403);
  }

  // 3. Route by path
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/admin-api/, '');

  // GET /stats
  if (path === '/stats' && req.method === 'GET') {
    return handleStats(serviceClient);
  }

  // GET /users
  if (path === '/users' && req.method === 'GET') {
    return handleUsers(serviceClient, url);
  }

  // GET /users/:id
  const userDetailMatch = path.match(/^\/users\/([a-f0-9-]+)$/);
  if (userDetailMatch && req.method === 'GET') {
    return handleUserDetail(serviceClient, userDetailMatch[1]);
  }

  // PATCH /users/:id
  if (userDetailMatch && req.method === 'PATCH') {
    return handleUserUpdate(serviceClient, userDetailMatch[1], req);
  }

  // GET /billing
  if (path === '/billing' && req.method === 'GET') {
    return handleBilling(serviceClient, url);
  }

  // GET /revenue
  if (path === '/revenue' && req.method === 'GET') {
    return handleRevenue(serviceClient);
  }

  return jsonResponse({ error: 'Not found' }, 404);
});
