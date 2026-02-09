import type { ProcessedEvent, RetentionCohort, RawRow, ColumnMapping } from '../types';
import {
  ACTIVITY_RETENTION_MAX_DAYS,
  PAID_RETENTION_DAYS,
  PAID_RETENTION_MAX_COHORTS,
  FULL_DATA_RETENTION_MAX_COHORTS
} from './constants';

export function calculateActivityRetention(
  processedData: ProcessedEvent[],
  cohortEvent: string,
  activeEvents: string[]
): RetentionCohort[] {
  const cohorts: Record<string, Set<string>> = {};

  processedData.forEach(event => {
    if (event.eventName === cohortEvent) {
      const cohortDate = event.timestamp.toISOString().split('T')[0];
      if (!cohorts[cohortDate]) {
        cohorts[cohortDate] = new Set();
      }
      cohorts[cohortDate].add(event.userId);
    }
  });

  const activeEventSet = new Set(activeEvents);
  const eventsByDate = new Map<string, ProcessedEvent[]>();
  processedData.forEach(e => {
    if (activeEventSet.has(e.eventName)) {
      const dateKey = e.timestamp.toISOString().split('T')[0];
      const bucket = eventsByDate.get(dateKey);
      if (bucket) {
        bucket.push(e);
      } else {
        eventsByDate.set(dateKey, [e]);
      }
    }
  });

  const retentionMatrix: RetentionCohort[] = [];

  Object.entries(cohorts).forEach(([cohortDate, userSet]) => {
    const cohortStartDate = new Date(cohortDate);
    const retention: RetentionCohort = { cohortDate, cohortSize: userSet.size, days: {} };

    for (let day = 0; day <= ACTIVITY_RETENTION_MAX_DAYS; day++) {
      const targetDate = new Date(cohortStartDate);
      targetDate.setDate(targetDate.getDate() + day);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      const eventsOnDay = eventsByDate.get(targetDateStr) || [];
      const uniqueActive = new Set(
        eventsOnDay.filter(e => userSet.has(e.userId)).map(e => e.userId)
      );
      const retentionRate = userSet.size > 0 ? (uniqueActive.size / userSet.size) * 100 : 0;
      retention.days[`D${day}`] = retentionRate;
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
