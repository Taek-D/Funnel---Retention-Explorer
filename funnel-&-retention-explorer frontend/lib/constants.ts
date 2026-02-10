import type { FunnelTemplates } from '../types';

export const EVENT_PATTERNS = {
  ecommerce: [
    'view_item', 'product_view', 'item_view', 'view_product',
    'add_to_cart', 'add_cart', 'cart_add', 'addtocart',
    'begin_checkout', 'checkout_start', 'checkout', 'start_checkout',
    'purchase', 'buy', 'order', 'transaction', 'complete_purchase'
  ],
  subscription: [
    'app_open', 'app_launch', 'open', 'launch',
    'signup', 'sign_up', 'register', 'registration',
    'onboarding', 'onboarding_complete', 'onboard',
    'start_trial', 'trial_start', 'free_trial', 'trial',
    'subscribe', 'subscription', 'payment', 'start_subscription'
  ]
};

export const FUNNEL_TEMPLATES: FunnelTemplates = {
  ecommerce: ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'],
  subscription: ['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe'],
  lifecycle: ['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe', 'renew']
};

export const KNOWN_PLATFORMS: string[] = [
  'ios', 'android', 'web', 'desktop', 'mobile',
  'windows', 'mac', 'macos', 'linux',
  'tablet', 'ipad', 'iphone',
  'chrome', 'safari', 'firefox',
];

export const KNOWN_CHANNELS: string[] = [
  'organic', 'paid', 'social', 'direct', 'email',
  'referral', 'google', 'facebook', 'instagram', 'twitter',
  'youtube', 'tiktok', 'cpc', 'cpm', 'display',
  'affiliate', 'push', 'sms', 'search', 'banner',
];

// === Analysis Constants ===

export const ACTIVITY_RETENTION_MAX_DAYS = 14;
export const PAID_RETENTION_DAYS = [0, 7, 14, 30, 60, 90] as const;
export const PAID_RETENTION_MAX_COHORTS = 10;
export const FULL_DATA_RETENTION_MAX_COHORTS = 7;
export const INSIGHTS_RETENTION_MAX_DAYS = 14;
export const RECENT_FILES_MAX_COUNT = 5;

// === Chart Theme Tokens ===
export const CHART_COLORS = {
  accent: '#00d4aa',
  accentGradientStart: 'rgba(0, 212, 170, 0.3)',
  accentGradientEnd: 'rgba(0, 212, 170, 0)',
  accentGradientMidStart: 'rgba(0, 212, 170, 0.5)',
  axisText: '#94a3b8',
  axisTextSecondary: '#64748b',
  gridLine: 'rgba(255,255,255,0.05)',
  tooltipBg: '#1a1f28',
  tooltipBorder: 'rgba(255,255,255,0.06)',
  cursorFill: 'rgba(255,255,255,0.05)',
  cellOpacity: (index: number) => `rgba(0, 212, 170, ${Math.max(0.25, 1 - index * 0.15)})`,
} as const;

export const AUTO_COLUMN_MAPPING: Record<string, string[]> = {
  timestamp: ['timestamp', 'time', 'date', 'datetime', 'created_at', 'updated_at', '날짜', '일자', '일시', '시간'],
  userid: ['user_id', 'userid', 'user', 'customer_id', 'customer', '사용자', '유저', '고객', '회원'],
  eventname: ['event_name', 'event', 'action', 'event_type', 'activity', '이벤트', '이벤트명', '행동', '액션'],
  sessionid: ['session_id', 'sessionid', 'session', 'visit_id', '세션', '방문'],
  platform: ['platform', 'device', 'os', 'device_type', '플랫폼', '기기', '디바이스'],
  channel: ['channel', 'source', 'utm_source', 'traffic_source', '채널', '유입경로', '소스']
};
