import type { ProcessedEvent, RetentionCohort, RawRow, ColumnMapping, CohortGrouping } from '../types';
import {
  ACTIVITY_RETENTION_MAX_DAYS,
  WEEKLY_RETENTION_MAX_PERIODS,
  MONTHLY_RETENTION_MAX_PERIODS,
  PAID_RETENTION_DAYS,
  PAID_RETENTION_MAX_COHORTS,
  FULL_DATA_RETENTION_MAX_COHORTS
} from './constants';
import { startSpan } from './sentry';

export function groupDateKey(date: Date, grouping: CohortGrouping): string {
  if (grouping === 'weekly') {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
  if (grouping === 'monthly') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  return date.toISOString().split('T')[0];
}

function advancePeriodKey(baseKey: string, n: number, grouping: CohortGrouping): string {
  if (grouping === 'monthly') {
    const [y, m] = baseKey.split('-').map(Number);
    const d = new Date(y, m - 1 + n, 15);
    return groupDateKey(d, 'monthly');
  }
  if (grouping === 'weekly') {
    const match = baseKey.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return baseKey;
    const year = parseInt(match[1]);
    const week = parseInt(match[2]);
    const jan4 = new Date(year, 0, 4);
    const dow = (jan4.getDay() + 6) % 7;
    const week1Mon = new Date(jan4);
    week1Mon.setDate(jan4.getDate() - dow);
    const target = new Date(week1Mon);
    target.setDate(week1Mon.getDate() + (week - 1 + n) * 7);
    return groupDateKey(target, 'weekly');
  }
  // daily
  const parts = baseKey.split('-').map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + n));
  return d.toISOString().split('T')[0];
}

export function calculateActivityRetention(
  processedData: ProcessedEvent[],
  cohortEvent: string,
  activeEvents: string[],
  grouping: CohortGrouping = 'daily'
): RetentionCohort[] {
  return startSpan('analysis.retention', 'compute', () => _calculateActivityRetention(processedData, cohortEvent, activeEvents, grouping));
}

function _calculateActivityRetention(
  processedData: ProcessedEvent[],
  cohortEvent: string,
  activeEvents: string[],
  grouping: CohortGrouping = 'daily'
): RetentionCohort[] {
  const cohorts: Record<string, Set<string>> = {};

  processedData.forEach(event => {
    if (event.eventName === cohortEvent) {
      const cohortKey = groupDateKey(event.timestamp, grouping);
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = new Set();
      }
      cohorts[cohortKey].add(event.userId);
    }
  });

  const activeEventSet = new Set(activeEvents);
  const eventsByPeriod = new Map<string, ProcessedEvent[]>();
  processedData.forEach(e => {
    if (activeEventSet.has(e.eventName)) {
      const periodKey = groupDateKey(e.timestamp, grouping);
      const bucket = eventsByPeriod.get(periodKey);
      if (bucket) {
        bucket.push(e);
      } else {
        eventsByPeriod.set(periodKey, [e]);
      }
    }
  });

  const maxPeriods = grouping === 'weekly' ? WEEKLY_RETENTION_MAX_PERIODS
    : grouping === 'monthly' ? MONTHLY_RETENTION_MAX_PERIODS
    : ACTIVITY_RETENTION_MAX_DAYS;
  const prefix = grouping === 'weekly' ? 'W' : grouping === 'monthly' ? 'M' : 'D';

  const retentionMatrix: RetentionCohort[] = [];

  Object.entries(cohorts).forEach(([cohortKey, userSet]) => {
    const retention: RetentionCohort = { cohortDate: cohortKey, cohortSize: userSet.size, days: {} };

    for (let period = 0; period <= maxPeriods; period++) {
      const targetKey = advancePeriodKey(cohortKey, period, grouping);
      const eventsInPeriod = eventsByPeriod.get(targetKey) || [];
      const uniqueActive = new Set(
        eventsInPeriod.filter(e => userSet.has(e.userId)).map(e => e.userId)
      );
      const retentionRate = userSet.size > 0 ? (uniqueActive.size / userSet.size) * 100 : 0;
      retention.days[`${prefix}${period}`] = retentionRate;
    }

    retentionMatrix.push(retention);
  });

  return retentionMatrix;
}

export function calculatePaidRetention(
  rawData: RawRow[],
  columnMapping: ColumnMapping
): RetentionCohort[] {
  const eventNameCol = columnMapping.eventname;
  const userIdCol = columnMapping.userid;
  const timestampCol = columnMapping.timestamp;
  if (!eventNameCol || !userIdCol || !timestampCol) return [];

  const userEvents: Record<string, { eventName: string; timestamp: Date }[]> = {};
  rawData.forEach(row => {
    const userId = row[userIdCol];
    const eventName = (row[eventNameCol] || '').toLowerCase();
    const timestamp = new Date(row[timestampCol]);
    if (!userId || isNaN(timestamp.getTime())) return;

    if (!userEvents[userId]) userEvents[userId] = [];
    userEvents[userId].push({ eventName, timestamp });
  });

  const cohorts: Record<string, Set<string>> = {};
  const userCancelDate: Record<string, Date> = {};

  Object.entries(userEvents).forEach(([userId, events]) => {
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const subscribeEvent = events.find(e => e.eventName.includes('subscribe'));
    if (!subscribeEvent) return;

    const cohortDate = subscribeEvent.timestamp.toISOString().split('T')[0];
    if (!cohorts[cohortDate]) cohorts[cohortDate] = new Set();
    cohorts[cohortDate].add(userId);

    const cancelEvent = events.find(e =>
      e.eventName.includes('cancel') && e.timestamp >= subscribeEvent.timestamp
    );
    if (cancelEvent) {
      userCancelDate[userId] = cancelEvent.timestamp;
    }
  });

  const retentionMatrix: RetentionCohort[] = [];

  Object.entries(cohorts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, PAID_RETENTION_MAX_COHORTS)
    .forEach(([cohortDate, userSet]) => {
      const cohortStartDate = new Date(cohortDate);
      const retention: RetentionCohort = { cohortDate, cohortSize: userSet.size, days: {} };

      PAID_RETENTION_DAYS.forEach(day => {
        const targetDate = new Date(cohortStartDate);
        targetDate.setDate(targetDate.getDate() + day);

        let retainedCount = 0;
        userSet.forEach(userId => {
          const cancelDate = userCancelDate[userId];
          if (!cancelDate || cancelDate > targetDate) {
            retainedCount++;
          }
        });

        retention.days[`D${day}`] = userSet.size > 0 ? (retainedCount / userSet.size) * 100 : 0;
      });

      retentionMatrix.push(retention);
    });

  return retentionMatrix;
}

export function calculateFullDataRetention(processedData: ProcessedEvent[]): RetentionCohort[] | null {
  if (!processedData || processedData.length === 0) return null;

  const eventCounts: Record<string, number> = {};
  processedData.forEach(e => {
    if (e.eventName) {
      eventCounts[e.eventName] = (eventCounts[e.eventName] || 0) + 1;
    }
  });

  if (Object.keys(eventCounts).length === 0) return null;

  const cohortEvent = Object.keys(eventCounts).reduce((a, b) =>
    eventCounts[a] > eventCounts[b] ? a : b
  );

  const cohortUsers: Record<string, Set<string>> = {};
  processedData
    .filter(event => event.eventName === cohortEvent)
    .forEach(event => {
      const dateKey = event.timestamp.toISOString().split('T')[0];
      if (!cohortUsers[dateKey]) {
        cohortUsers[dateKey] = new Set();
      }
      cohortUsers[dateKey].add(event.userId);
    });

  const cohortDates = Object.keys(cohortUsers).sort();
  if (cohortDates.length === 0) return null;

  const allEventsByDate = new Map<string, ProcessedEvent[]>();
  processedData.forEach(e => {
    const dateKey = e.timestamp.toISOString().split('T')[0];
    const bucket = allEventsByDate.get(dateKey);
    if (bucket) {
      bucket.push(e);
    } else {
      allEventsByDate.set(dateKey, [e]);
    }
  });

  const retentionData: RetentionCohort[] = [];

  cohortDates.slice(0, FULL_DATA_RETENTION_MAX_COHORTS).forEach(cohortDate => {
    const cohortSet = cohortUsers[cohortDate];
    const cohortTimestamp = new Date(cohortDate);
    const retention: RetentionCohort = { cohortDate, cohortSize: cohortSet.size, days: {} };

    for (let day = 0; day <= ACTIVITY_RETENTION_MAX_DAYS; day++) {
      const targetDate = new Date(cohortTimestamp);
      targetDate.setDate(targetDate.getDate() + day);
      const targetDateKey = targetDate.toISOString().split('T')[0];

      const eventsOnDay = allEventsByDate.get(targetDateKey) || [];
      const activeUserSet = new Set(
        eventsOnDay.filter(e => cohortSet.has(e.userId)).map(e => e.userId)
      );
      retention.days[`D${day}`] = cohortSet.size > 0 ? (activeUserSet.size / cohortSet.size) * 100 : 0;
    }

    retentionData.push(retention);
  });

  return retentionData.length > 0 ? retentionData : null;
}

export type RetentionComparisonDay = {
  day: string;
  rateA: number;
  rateB: number;
  diff: number;
  direction: 'up' | 'down' | 'same';
};

export type RetentionComparisonResult = {
  days: RetentionComparisonDay[];
  cohortsA: number;
  cohortsB: number;
  totalUsersA: number;
  totalUsersB: number;
};

export function compareRetention(
  resultA: RetentionCohort[],
  resultB: RetentionCohort[]
): RetentionComparisonResult {
  const dayKeys = new Set<string>();
  [...resultA, ...resultB].forEach(c => {
    Object.keys(c.days).forEach(k => dayKeys.add(k));
  });

  const sortedDays = [...dayKeys].sort((a, b) => {
    const numA = parseInt(a.replace(/^[DWM]/, ''), 10);
    const numB = parseInt(b.replace(/^[DWM]/, ''), 10);
    return numA - numB;
  });

  const avgRate = (cohorts: RetentionCohort[], day: string): number => {
    const vals = cohorts.map(c => c.days[day]).filter(v => v !== undefined);
    if (vals.length === 0) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };

  const days: RetentionComparisonDay[] = sortedDays.map(day => {
    const rateA = avgRate(resultA, day);
    const rateB = avgRate(resultB, day);
    const diff = rateB - rateA;
    return {
      day,
      rateA,
      rateB,
      diff,
      direction: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'same',
    };
  });

  return {
    days,
    cohortsA: resultA.length,
    cohortsB: resultB.length,
    totalUsersA: resultA.reduce((s, c) => s + c.cohortSize, 0),
    totalUsersB: resultB.reduce((s, c) => s + c.cohortSize, 0),
  };
}
