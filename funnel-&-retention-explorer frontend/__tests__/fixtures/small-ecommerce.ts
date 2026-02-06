/**
 * Deterministic 10-user ecommerce fixture.
 * Known funnel: view_item(10) → add_to_cart(7) → begin_checkout(4) → purchase(2)
 *
 * Platforms: ios(4), android(4), web(2)
 * Channels: organic(5), paid_social(3), referral(2)
 */
export const SMALL_ECOMMERCE_CSV = `timestamp,user_id,session_id,event_name,platform,channel
2025-01-01T10:00:00Z,u001,s001,session_start,ios,organic
2025-01-01T10:01:00Z,u001,s001,view_item,ios,organic
2025-01-01T10:05:00Z,u001,s001,add_to_cart,ios,organic
2025-01-01T10:10:00Z,u001,s001,begin_checkout,ios,organic
2025-01-01T10:15:00Z,u001,s001,purchase,ios,organic
2025-01-01T10:30:00Z,u002,s002,session_start,android,organic
2025-01-01T10:31:00Z,u002,s002,view_item,android,organic
2025-01-01T10:35:00Z,u002,s002,add_to_cart,android,organic
2025-01-01T10:40:00Z,u002,s002,begin_checkout,android,organic
2025-01-01T10:45:00Z,u002,s002,purchase,android,organic
2025-01-01T11:00:00Z,u003,s003,session_start,ios,paid_social
2025-01-01T11:01:00Z,u003,s003,view_item,ios,paid_social
2025-01-01T11:05:00Z,u003,s003,add_to_cart,ios,paid_social
2025-01-01T11:10:00Z,u003,s003,begin_checkout,ios,paid_social
2025-01-01T11:30:00Z,u004,s004,session_start,android,paid_social
2025-01-01T11:31:00Z,u004,s004,view_item,android,paid_social
2025-01-01T11:35:00Z,u004,s004,add_to_cart,android,paid_social
2025-01-01T11:40:00Z,u004,s004,begin_checkout,android,paid_social
2025-01-01T12:00:00Z,u005,s005,session_start,web,organic
2025-01-01T12:01:00Z,u005,s005,view_item,web,organic
2025-01-01T12:05:00Z,u005,s005,add_to_cart,web,organic
2025-01-01T12:30:00Z,u006,s006,session_start,ios,referral
2025-01-01T12:31:00Z,u006,s006,view_item,ios,referral
2025-01-01T12:35:00Z,u006,s006,add_to_cart,ios,referral
2025-01-01T13:00:00Z,u007,s007,session_start,android,organic
2025-01-01T13:01:00Z,u007,s007,view_item,android,organic
2025-01-01T13:05:00Z,u007,s007,add_to_cart,android,organic
2025-01-01T13:30:00Z,u008,s008,session_start,android,paid_social
2025-01-01T13:31:00Z,u008,s008,view_item,android,paid_social
2025-01-01T14:00:00Z,u009,s009,session_start,web,referral
2025-01-01T14:01:00Z,u009,s009,view_item,web,referral
2025-01-01T14:30:00Z,u010,s010,session_start,ios,organic
2025-01-01T14:31:00Z,u010,s010,view_item,ios,organic`;

/**
 * Expected funnel results for steps: view_item → add_to_cart → begin_checkout → purchase
 *
 * view_item: u001..u010 = 10 users
 * add_to_cart: u001..u007 (all who viewed also carted) = 7 users
 * begin_checkout: u001..u004 = 4 users
 * purchase: u001, u002 = 2 users
 */
export const EXPECTED_FUNNEL = {
  steps: ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'],
  users: [10, 7, 4, 2],
};

export const EXPECTED_PLATFORMS = ['android', 'ios', 'web'];
export const EXPECTED_CHANNELS = ['organic', 'paid_social', 'referral'];
export const EXPECTED_UNIQUE_USERS = 10;
export const EXPECTED_DETECTED_TYPE = 'ecommerce' as const;
