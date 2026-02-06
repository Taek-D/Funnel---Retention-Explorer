/**
 * Deterministic 8-user subscription fixture.
 * Funnel: app_open(8) → signup(7) → onboarding_complete(5) → start_trial(4) → subscribe(2)
 * Cancel: 1 user cancels (u001)
 * Revenue: subscribe=9900, renew=9900
 *
 * Platforms: ios(4), android(4)
 * Channels: organic(3), paid_social(3), referral(2)
 */
export const SMALL_SUBSCRIPTION_CSV = `timestamp,user_id,session_id,event_name,platform,channel,plan,trial_days,revenue,cancel_reason
2025-01-01T08:00:00Z,u001,s001,app_open,ios,organic,free,,,
2025-01-01T08:05:00Z,u001,s001,signup,ios,organic,free,,,
2025-01-01T08:15:00Z,u001,s001,onboarding_complete,ios,organic,free,,,
2025-01-01T08:30:00Z,u001,s001,start_trial,ios,organic,trial,14,,
2025-01-05T10:00:00Z,u001,s011,subscribe,ios,organic,monthly,,9900,
2025-01-20T10:00:00Z,u001,s012,cancel,ios,organic,monthly,,,too_expensive
2025-01-01T09:00:00Z,u002,s002,app_open,android,paid_social,free,,,
2025-01-01T09:05:00Z,u002,s002,signup,android,paid_social,free,,,
2025-01-01T09:15:00Z,u002,s002,onboarding_complete,android,paid_social,free,,,
2025-01-01T09:30:00Z,u002,s002,start_trial,android,paid_social,trial,7,,
2025-01-04T10:00:00Z,u002,s021,subscribe,android,paid_social,yearly,,9900,
2025-02-04T10:00:00Z,u002,s022,renew,android,paid_social,yearly,,9900,
2025-01-01T10:00:00Z,u003,s003,app_open,ios,referral,free,,,
2025-01-01T10:05:00Z,u003,s003,signup,ios,referral,free,,,
2025-01-01T10:15:00Z,u003,s003,onboarding_complete,ios,referral,free,,,
2025-01-01T10:30:00Z,u003,s003,start_trial,ios,referral,trial,14,,
2025-01-01T11:00:00Z,u004,s004,app_open,android,organic,free,,,
2025-01-01T11:05:00Z,u004,s004,signup,android,organic,free,,,
2025-01-01T11:15:00Z,u004,s004,onboarding_complete,android,organic,free,,,
2025-01-01T12:00:00Z,u005,s005,app_open,ios,paid_social,free,,,
2025-01-01T12:05:00Z,u005,s005,signup,ios,paid_social,free,,,
2025-01-01T12:15:00Z,u005,s005,onboarding_complete,ios,paid_social,free,,,
2025-01-01T13:00:00Z,u006,s006,app_open,android,paid_social,free,,,
2025-01-01T13:05:00Z,u006,s006,signup,android,paid_social,free,,,
2025-01-01T14:00:00Z,u007,s007,app_open,ios,organic,free,,,
2025-01-01T14:05:00Z,u007,s007,signup,ios,organic,free,,,
2025-01-01T15:00:00Z,u008,s008,app_open,android,referral,free,,,`;

/**
 * Expected funnel: app_open→signup→onboarding_complete→start_trial→subscribe
 * app_open: u001..u008 = 8
 * signup: u001..u007 = 7 (u008 doesn't signup)
 * onboarding_complete: u001..u005 = 5 (among signup users)
 * start_trial: u001,u002,u003 = 3 (among onboarding_complete users; u004,u005 didn't trial)
 * subscribe: u001,u002 = 2 (among start_trial users)
 */
export const EXPECTED_SUBSCRIPTION_FUNNEL = {
  steps: ['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe'],
  users: [8, 7, 5, 3, 2],
};

export const EXPECTED_DETECTED_TYPE = 'subscription' as const;
export const EXPECTED_TOTAL_USERS = 8;
export const EXPECTED_SUBSCRIBE_USERS = 2;
export const EXPECTED_CANCEL_USERS = 1;
export const EXPECTED_GROSS_REVENUE = 29700; // 9900 * 3 (2 subscribe + 1 renew)
