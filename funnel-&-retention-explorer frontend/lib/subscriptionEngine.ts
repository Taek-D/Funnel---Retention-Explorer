import type { RawRow, ColumnMapping, SubscriptionKPIs, TrialAnalysis, ChurnAnalysis } from '../types';
import { hasCol, getColValue } from './dataProcessor';

export function calculateSubscriptionKPIs(
  rawData: RawRow[],
  columnMapping: ColumnMapping,
  headers: string[]
): SubscriptionKPIs | null {
  if (!rawData || rawData.length === 0) return null;

  const eventNameCol = columnMapping.eventname;
  if (!eventNameCol) return null;

  const countEvents = (eventPattern: string): number => {
    return rawData.filter(row => {
      const eventName = (row[eventNameCol] || '').toLowerCase();
      return eventName.includes(eventPattern.toLowerCase());
    }).length;
  };

  const getUsersByEvent = (eventPattern: string): Set<string> => {
    const userIdCol = columnMapping.userid;
    if (!userIdCol) return new Set();
    return new Set(
      rawData.filter(row => {
        const eventName = (row[eventNameCol] || '').toLowerCase();
        return eventName.includes(eventPattern.toLowerCase());
      }).map(row => row[userIdCol])
    );
  };

  const usersTotal = new Set(rawData.map(row => row[columnMapping.userid || '']).filter(Boolean)).size;
  const usersSignup = getUsersByEvent('signup').size;
  const usersOnboarded = getUsersByEvent('onboarding').size || getUsersByEvent('onboarding_complete').size;
  const usersTrial = getUsersByEvent('start_trial').size || getUsersByEvent('trial').size;
  const usersSubscribed = getUsersByEvent('subscribe').size;

  const subscribeEvents = countEvents('subscribe');
  const renewEvents = countEvents('renew');
  const cancelEvents = countEvents('cancel');
  const paymentFailedEvents = countEvents('payment_failed');

  const subscribeUsers = getUsersByEvent('subscribe');
  const renewUsers = getUsersByEvent('renew');
  const paidUsers = new Set([...subscribeUsers, ...renewUsers]);
  const paidUserCount = paidUsers.size;

  let grossRevenue = 0;
  let netRevenue = 0;
  const hasRevenue = hasCol(headers, 'revenue');
  if (hasRevenue) {
    rawData.forEach(row => {
      const rev = parseFloat(getColValue(row, 'revenue') || '0') || 0;
      if (rev > 0) grossRevenue += rev;
      netRevenue += rev;
    });
  }

  const arppu = paidUserCount > 0 && hasRevenue ? grossRevenue / paidUserCount : null;

  const planMix = { monthly: 0, yearly: 0, other: 0 };
  if (hasCol(headers, 'plan')) {
    const planCounts: Record<string, number> = {};
    rawData.forEach(row => {
      const eventName = (row[eventNameCol] || '').toLowerCase();
      if (eventName.includes('subscribe') || eventName.includes('renew')) {
        const plan = (getColValue(row, 'plan') || 'unknown').toLowerCase();
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      }
    });
    const total = Object.values(planCounts).reduce((a, b) => a + b, 0);
    if (total > 0) {
      Object.entries(planCounts).forEach(([plan, count]) => {
        if (plan.includes('month')) {
          planMix.monthly += (count / total) * 100;
        } else if (plan.includes('year') || plan.includes('annual')) {
          planMix.yearly += (count / total) * 100;
        } else {
          planMix.other += (count / total) * 100;
        }
      });
    }
  }

  const cancelUsers = getUsersByEvent('cancel');
  const cancelledPaidUsers = [...cancelUsers].filter(u => paidUsers.has(u));
  const cancelRatePaid = paidUserCount > 0 ? (cancelledPaidUsers.length / paidUserCount) * 100 : 0;

  const renewSuccessRate = (renewEvents + paymentFailedEvents) > 0
    ? (renewEvents / (renewEvents + paymentFailedEvents)) * 100
    : null;

  return {
    users_total: usersTotal,
    users_signup: usersSignup,
    users_onboarded: usersOnboarded,
    users_trial: usersTrial,
    users_subscribed: usersSubscribed,
    subscribe_events: subscribeEvents,
    renew_events: renewEvents,
    cancel_events: cancelEvents,
    payment_failed_events: paymentFailedEvents,
    paid_user_count: paidUserCount,
    gross_revenue: hasRevenue ? grossRevenue : null,
    net_revenue: hasRevenue ? netRevenue : null,
    arppu,
    plan_mix: planMix,
    cancel_rate_paid: cancelRatePaid,
    renew_success_rate: renewSuccessRate
  };
}

export function analyzeTrialConversion(
  rawData: RawRow[],
  columnMapping: ColumnMapping,
  headers: string[]
): TrialAnalysis | null {
  if (!rawData || rawData.length === 0) return null;

  const eventNameCol = columnMapping.eventname;
  const userIdCol = columnMapping.userid;
  const timestampCol = columnMapping.timestamp;
  if (!eventNameCol || !userIdCol || !timestampCol) return null;

  const userEvents: Record<string, { eventName: string; timestamp: Date; trialDays: string | null }[]> = {};
  rawData.forEach(row => {
    const userId = row[userIdCol];
    const eventName = (row[eventNameCol] || '').toLowerCase();
    const timestamp = new Date(row[timestampCol]);
    if (!userId || isNaN(timestamp.getTime())) return;

    if (!userEvents[userId]) userEvents[userId] = [];
    userEvents[userId].push({
      eventName,
      timestamp,
      trialDays: getColValue(row, 'trial_days')
    });
  });

  const trialUsers: Record<string, { trial_users: number; subscribed_users: number; conversion_times: number[] }> = {};
  const hasTrialDaysCol = hasCol(headers, 'trial_days');

  Object.entries(userEvents).forEach(([, events]) => {
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const trialEvent = events.find(e => e.eventName.includes('start_trial') || e.eventName === 'trial');
    if (!trialEvent) return;

    const subscribeEvent = events.find(e =>
      e.eventName.includes('subscribe') && e.timestamp >= trialEvent.timestamp
    );

    const trialDays = hasTrialDaysCol && trialEvent.trialDays ? trialEvent.trialDays : 'Unknown';

    if (!trialUsers[trialDays]) {
      trialUsers[trialDays] = { trial_users: 0, subscribed_users: 0, conversion_times: [] };
    }

    trialUsers[trialDays].trial_users++;

    if (subscribeEvent) {
      trialUsers[trialDays].subscribed_users++;
      const hoursToConvert = (subscribeEvent.timestamp.getTime() - trialEvent.timestamp.getTime()) / (1000 * 60 * 60);
      trialUsers[trialDays].conversion_times.push(hoursToConvert);
    }
  });

  const byTrialDays = Object.entries(trialUsers).map(([trialDays, data]) => {
    const times = [...data.conversion_times].sort((a, b) => a - b);
    const medianIdx = Math.floor(times.length / 2);
    const p90Idx = Math.floor(times.length * 0.9);

    return {
      trial_days: trialDays,
      trial_users: data.trial_users,
      subscribed_users: data.subscribed_users,
      conversion_rate: data.trial_users > 0 ? (data.subscribed_users / data.trial_users) * 100 : 0,
      median_time_to_subscribe_hours: times.length > 0 ? times[medianIdx] : null,
      p90_time_to_subscribe_hours: times.length > 0 ? (times[p90Idx] || times[times.length - 1]) : null
    };
  }).sort((a, b) => {
    const aDays = parseInt(a.trial_days) || 999;
    const bDays = parseInt(b.trial_days) || 999;
    return aDays - bDays;
  });

  const totalTrialUsers = byTrialDays.reduce((sum, g) => sum + g.trial_users, 0);
  const totalSubscribedUsers = byTrialDays.reduce((sum, g) => sum + g.subscribed_users, 0);
  const allTimes = byTrialDays.flatMap(g =>
    trialUsers[g.trial_days]?.conversion_times || []
  ).sort((a, b) => a - b);

  return {
    by_trial_days: byTrialDays,
    overall: {
      trial_users: totalTrialUsers,
      subscribed_users: totalSubscribedUsers,
      conversion_rate: totalTrialUsers > 0 ? (totalSubscribedUsers / totalTrialUsers) * 100 : 0,
      median_hours: allTimes.length > 0 ? allTimes[Math.floor(allTimes.length / 2)] : null,
      p90_hours: allTimes.length > 0 ? allTimes[Math.floor(allTimes.length * 0.9)] : null
    }
  };
}

export function analyzeChurn(
  rawData: RawRow[],
  columnMapping: ColumnMapping
): ChurnAnalysis | null {
  if (!rawData || rawData.length === 0) return null;

  const eventNameCol = columnMapping.eventname;
  const userIdCol = columnMapping.userid;
  const timestampCol = columnMapping.timestamp;
  if (!eventNameCol || !userIdCol || !timestampCol) return null;

  const userEvents: Record<string, {
    eventName: string; timestamp: Date;
    cancelReason: string | null; plan: string | null; channel: string | null;
  }[]> = {};

  rawData.forEach(row => {
    const userId = row[userIdCol];
    const eventName = (row[eventNameCol] || '').toLowerCase();
    const timestamp = new Date(row[timestampCol]);
    if (!userId || isNaN(timestamp.getTime())) return;

    if (!userEvents[userId]) userEvents[userId] = [];
    userEvents[userId].push({
      eventName,
      timestamp,
      cancelReason: getColValue(row, 'cancel_reason'),
      plan: getColValue(row, 'plan'),
      channel: getColValue(row, 'channel') || (columnMapping.channel ? row[columnMapping.channel] : null)
    });
  });

  const paidUsers = new Set<string>();
  const churnedUsers: Record<string, { eventName: string; timestamp: Date }> = {};
  const cancelReasons: Record<string, number> = {};
  const cancelTimes: number[] = [];
  const churnByPlan: Record<string, { churned: number; total: number }> = {};
  const churnByChannel: Record<string, { churned: number; total: number }> = {};

  Object.entries(userEvents).forEach(([userId, events]) => {
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const subscribeEvent = events.find(e => e.eventName.includes('subscribe'));
    const renewEvent = events.find(e => e.eventName.includes('renew'));

    if (subscribeEvent || renewEvent) {
      paidUsers.add(userId);
    }

    const cancelEvent = events.find(e => e.eventName.includes('cancel'));
    if (cancelEvent && (subscribeEvent || renewEvent)) {
      churnedUsers[userId] = cancelEvent;

      const reason = cancelEvent.cancelReason || 'Unknown';
      cancelReasons[reason] = (cancelReasons[reason] || 0) + 1;

      const firstPaidEvent = subscribeEvent || renewEvent;
      if (firstPaidEvent) {
        const daysToCancel = (cancelEvent.timestamp.getTime() - firstPaidEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        cancelTimes.push(daysToCancel);
      }

      const plan = ((subscribeEvent || renewEvent)?.plan || 'Unknown').toLowerCase();
      if (!churnByPlan[plan]) churnByPlan[plan] = { churned: 0, total: 0 };
      churnByPlan[plan].churned++;

      const channel = (subscribeEvent || renewEvent)?.channel || 'Unknown';
      if (!churnByChannel[channel]) churnByChannel[channel] = { churned: 0, total: 0 };
      churnByChannel[channel].churned++;
    }

    if (subscribeEvent || renewEvent) {
      const plan = ((subscribeEvent || renewEvent)?.plan || 'Unknown').toLowerCase();
      if (!churnByPlan[plan]) churnByPlan[plan] = { churned: 0, total: 0 };
      churnByPlan[plan].total++;

      const channel = (subscribeEvent || renewEvent)?.channel || 'Unknown';
      if (!churnByChannel[channel]) churnByChannel[channel] = { churned: 0, total: 0 };
      churnByChannel[channel].total++;
    }
  });

  const churnUserCount = Object.keys(churnedUsers).length;
  const paidUserCount = paidUsers.size;
  const churnRatePaid = paidUserCount > 0 ? (churnUserCount / paidUserCount) * 100 : 0;

  const cancelReasonTop = Object.entries(cancelReasons)
    .map(([reason, users]) => ({
      reason,
      users,
      share: churnUserCount > 0 ? (users / churnUserCount) * 100 : 0
    }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 5);

  cancelTimes.sort((a, b) => a - b);
  const medianIdx = Math.floor(cancelTimes.length / 2);
  const p90Idx = Math.floor(cancelTimes.length * 0.9);

  return {
    churn_users: churnUserCount,
    churn_rate_paid: churnRatePaid,
    cancel_reason_top: cancelReasonTop,
    time_to_cancel_median_days: cancelTimes.length > 0 ? cancelTimes[medianIdx] : null,
    time_to_cancel_p90_days: cancelTimes.length > 0 ? (cancelTimes[p90Idx] || cancelTimes[cancelTimes.length - 1]) : null,
    churn_by_plan: Object.entries(churnByPlan).map(([plan, data]) => ({
      plan,
      churn_rate: data.total > 0 ? (data.churned / data.total) * 100 : 0,
      n: data.total
    })),
    churn_by_channel: Object.entries(churnByChannel).map(([channel, data]) => ({
      channel,
      churn_rate: data.total > 0 ? (data.churned / data.total) * 100 : 0,
      n: data.total
    }))
  };
}
