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

export const AUTO_COLUMN_MAPPING: Record<string, string[]> = {
  timestamp: ['timestamp', 'time', 'date', 'datetime', 'created_at', 'updated_at', '날짜', '일자', '일시', '시간'],
  userid: ['user_id', 'userid', 'user', 'customer_id', 'customer', '사용자', '유저', '고객', '회원'],
  eventname: ['event_name', 'event', 'action', 'event_type', 'activity', '이벤트', '이벤트명', '행동', '액션'],
  sessionid: ['session_id', 'sessionid', 'session', 'visit_id', '세션', '방문'],
  platform: ['platform', 'device', 'os', 'device_type', '플랫폼', '기기', '디바이스'],
  channel: ['channel', 'source', 'utm_source', 'traffic_source', '채널', '유입경로', '소스']
};
