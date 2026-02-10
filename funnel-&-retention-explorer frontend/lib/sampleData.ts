import type { RawRow, ColumnMapping } from '../types';

type SampleDataType = 'ecommerce' | 'saas';

interface SampleDataResult {
  data: RawRow[];
  headers: string[];
  mapping: ColumnMapping;
  fileName: string;
}

const PLATFORMS_ECOM = [
  { value: 'web', weight: 60 },
  { value: 'mobile', weight: 30 },
  { value: 'ios', weight: 10 },
];

const PLATFORMS_SAAS = [
  { value: 'web', weight: 70 },
  { value: 'mobile', weight: 20 },
  { value: 'desktop', weight: 10 },
];

const CHANNELS = [
  { value: 'organic', weight: 40 },
  { value: 'paid', weight: 35 },
  { value: 'referral', weight: 25 },
];

function weightedRandom<T extends { value: string; weight: number }>(items: T[]): string {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function randomDate(startMs: number, endMs: number): Date {
  return new Date(startMs + Math.random() * (endMs - startMs));
}

function addMinutes(date: Date, min: number, max: number): Date {
  const offset = (min + Math.random() * (max - min)) * 60 * 1000;
  return new Date(date.getTime() + offset);
}

function generateEcommerceData(): RawRow[] {
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
  const userCount = 300;
  const rows: RawRow[] = [];

  const funnelSteps = ['page_view', 'product_view', 'add_to_cart', 'checkout_start', 'purchase'];
  const stepDropRates = [0, 0.35, 0.54, 0.50, 0.67];

  for (let u = 1; u <= userCount; u++) {
    const userId = `user_${String(u).padStart(3, '0')}`;
    const platform = weightedRandom(PLATFORMS_ECOM);
    const channel = weightedRandom(CHANNELS);
    const sessionCount = 1 + Math.floor(Math.random() * 3);

    for (let s = 0; s < sessionCount; s++) {
      const sessionId = `sess_${userId}_${s}`;
      let ts = randomDate(ninetyDaysAgo, now);
      let dropped = false;

      for (let i = 0; i < funnelSteps.length; i++) {
        if (dropped) break;
        if (i > 0 && Math.random() < stepDropRates[i]) {
          dropped = true;
          break;
        }

        rows.push({
          timestamp: ts.toISOString(),
          user_id: userId,
          event_name: funnelSteps[i],
          session_id: sessionId,
          platform,
          channel,
        });

        ts = addMinutes(ts, 1, 30);
      }
    }
  }

  return rows;
}

function generateSaaSData(): RawRow[] {
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
  const userCount = 200;
  const rows: RawRow[] = [];

  const funnelSteps = ['signup', 'onboarding_complete', 'feature_use', 'subscription_start'];
  const stepDropRates = [0, 0.40, 0.33, 0.63];

  for (let u = 1; u <= userCount; u++) {
    const userId = `user_${String(u).padStart(3, '0')}`;
    const platform = weightedRandom(PLATFORMS_SAAS);
    const channel = weightedRandom(CHANNELS);
    const sessionId = `sess_${userId}_0`;
    let ts = randomDate(ninetyDaysAgo, now);
    let dropped = false;
    let subscribed = false;

    for (let i = 0; i < funnelSteps.length; i++) {
      if (dropped) break;
      if (i > 0 && Math.random() < stepDropRates[i]) {
        dropped = true;
        break;
      }

      rows.push({
        timestamp: ts.toISOString(),
        user_id: userId,
        event_name: funnelSteps[i],
        session_id: sessionId,
        platform,
        channel,
      });

      if (funnelSteps[i] === 'subscription_start') {
        subscribed = true;
      }

      // feature_use repeats 1~10 times for retention data
      if (funnelSteps[i] === 'feature_use') {
        const repeatCount = 1 + Math.floor(Math.random() * 9);
        for (let r = 0; r < repeatCount; r++) {
          ts = addMinutes(ts, 60, 60 * 24); // 1 hour ~ 1 day later
          rows.push({
            timestamp: ts.toISOString(),
            user_id: userId,
            event_name: 'feature_use',
            session_id: `sess_${userId}_${r + 1}`,
            platform,
            channel,
          });
        }
      }

      ts = addMinutes(ts, 30, 60 * 24);
    }

    // subscription_cancel for ~33% of subscribers
    if (subscribed && Math.random() < 0.33) {
      const cancelDelay = (7 + Math.random() * 53) * 24 * 60; // 7~60 days in minutes
      const cancelTs = addMinutes(ts, cancelDelay, cancelDelay + 60);
      if (cancelTs.getTime() <= now) {
        rows.push({
          timestamp: cancelTs.toISOString(),
          user_id: userId,
          event_name: 'subscription_cancel',
          session_id: `sess_${userId}_cancel`,
          platform,
          channel,
        });
      }
    }
  }

  return rows;
}

const SHARED_MAPPING: ColumnMapping = {
  timestamp: 'timestamp',
  userid: 'user_id',
  eventname: 'event_name',
  sessionid: 'session_id',
  platform: 'platform',
  channel: 'channel',
};

const HEADERS = ['timestamp', 'user_id', 'event_name', 'session_id', 'platform', 'channel'];

export function generateSampleData(type: SampleDataType): SampleDataResult {
  const data = type === 'ecommerce' ? generateEcommerceData() : generateSaaSData();

  // Sort by timestamp
  data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const label = type === 'ecommerce' ? '이커머스' : 'SaaS';

  return {
    data,
    headers: HEADERS,
    mapping: { ...SHARED_MAPPING },
    fileName: `sample_${type}_data.csv (${label} 샘플)`,
  };
}

export type { SampleDataType, SampleDataResult };
