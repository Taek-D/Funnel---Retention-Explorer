import type { RawRow, ColumnMapping } from '../types';
import { EVENT_PATTERNS, KNOWN_PLATFORMS, KNOWN_CHANNELS } from './constants';

interface ColumnProfile {
  header: string;
  totalRows: number;
  nonEmpty: number;
  uniqueCount: number;
  cardinality: number; // uniqueCount / nonEmpty (0~1)
  avgLength: number;
  allNumeric: boolean;
  sampleValues: string[];
}

type MappingKey = keyof ColumnMapping;

const DATE_REGEX = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/;
const EPOCH_MS_MIN = 946684800000; // 2000-01-01
const EPOCH_MS_MAX = 2524608000000; // 2050-01-01
const EPOCH_S_MIN = 946684800;
const EPOCH_S_MAX = 2524608000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_PATTERN = /^[a-z_]*\d+$/i; // e.g. u_123, user456, 12345
const ALNUM_LONG = /^[a-z0-9_-]{6,40}$/i;

function buildColumnProfile(header: string, rawData: RawRow[], sampleSize: number): ColumnProfile {
  const sample = rawData.slice(0, sampleSize);
  const values = sample.map(row => (row[header] ?? '').toString().trim());
  const nonEmptyValues = values.filter(v => v !== '');
  const uniqueSet = new Set(nonEmptyValues);

  const totalLen = nonEmptyValues.reduce((sum, v) => sum + v.length, 0);
  const allNumeric = nonEmptyValues.length > 0 && nonEmptyValues.every(v => /^-?\d+(\.\d+)?$/.test(v));

  return {
    header,
    totalRows: sample.length,
    nonEmpty: nonEmptyValues.length,
    uniqueCount: uniqueSet.size,
    cardinality: nonEmptyValues.length > 0 ? uniqueSet.size / nonEmptyValues.length : 0,
    avgLength: nonEmptyValues.length > 0 ? totalLen / nonEmptyValues.length : 0,
    allNumeric,
    sampleValues: nonEmptyValues.slice(0, 100),
  };
}

function scoreTimestamp(profile: ColumnProfile): number {
  if (profile.nonEmpty === 0) return 0;

  const values = profile.sampleValues;
  let dateRegexHits = 0;
  let parseHits = 0;
  let epochHits = 0;

  for (const v of values) {
    if (DATE_REGEX.test(v)) dateRegexHits++;

    // Only count Date parse for non-numeric strings to avoid false positives
    // (JS treats numeric strings like '0', '54' as valid year numbers)
    if (!profile.allNumeric) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) parseHits++;
    }

    if (profile.allNumeric) {
      const n = Number(v);
      if ((n >= EPOCH_S_MIN && n <= EPOCH_S_MAX) || (n >= EPOCH_MS_MIN && n <= EPOCH_MS_MAX)) {
        epochHits++;
      }
    }
  }

  const total = values.length;
  const regexRate = dateRegexHits / total;
  const parseRate = profile.allNumeric ? 0 : parseHits / total;
  const epochRate = epochHits / total;

  let score = Math.max(regexRate * 0.9, parseRate * 0.7, epochRate * 0.85);

  // High cardinality bonus (timestamps are usually unique or near-unique)
  if (profile.cardinality > 0.8) score += 0.1;

  // Low cardinality penalty (timestamps shouldn't have <10% unique)
  if (profile.cardinality < 0.1) score *= 0.3;

  return Math.min(score, 1.0);
}

function scoreUserId(profile: ColumnProfile): number {
  if (profile.nonEmpty === 0) return 0;

  let score = 0;

  // Medium cardinality: 20-95% unique
  if (profile.cardinality >= 0.2 && profile.cardinality <= 0.95) {
    score += 0.4;
  } else if (profile.cardinality > 0.05 && profile.cardinality < 0.2) {
    score += 0.2;
  }

  // ID pattern matching
  const values = profile.sampleValues;
  let idPatternHits = 0;
  for (const v of values) {
    if (ID_PATTERN.test(v) || UUID_REGEX.test(v)) idPatternHits++;
  }
  const idRate = idPatternHits / values.length;
  score += idRate * 0.3;

  // Consistent string length bonus
  const lengths = values.map(v => v.length);
  const minLen = Math.min(...lengths);
  const maxLen = Math.max(...lengths);
  if (maxLen > 0 && (maxLen - minLen) / maxLen < 0.3) {
    score += 0.15;
  }

  // Penalty: all numeric with small values (likely counts/amounts, not IDs)
  if (profile.allNumeric) {
    const nums = values.map(Number);
    const maxNum = Math.max(...nums);
    if (maxNum < 100 && profile.uniqueCount < 20) {
      score *= 0.3;
    }
  }

  return Math.min(score, 1.0);
}

function scoreEventName(profile: ColumnProfile): number {
  if (profile.nonEmpty === 0) return 0;

  let score = 0;

  // Low cardinality (<50% unique)
  if (profile.cardinality < 0.5) {
    score += 0.3;
  } else if (profile.cardinality < 0.7) {
    score += 0.1;
  }

  // Short strings
  if (profile.avgLength > 2 && profile.avgLength < 40) {
    score += 0.15;
  }

  // EVENT_PATTERNS matching
  const allPatterns = [...EVENT_PATTERNS.ecommerce, ...EVENT_PATTERNS.subscription];
  const lowerValues = [...new Set(profile.sampleValues.map(v => v.toLowerCase()))];
  let patternMatches = 0;
  for (const val of lowerValues) {
    for (const pattern of allPatterns) {
      if (val.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(val)) {
        patternMatches++;
        break;
      }
    }
  }
  if (patternMatches >= 2) score += 0.4;
  else if (patternMatches >= 1) score += 0.2;

  // Contains underscores or looks like event names (snake_case)
  const snakeCaseCount = profile.sampleValues.filter(v => /^[a-z][a-z0-9_]*$/.test(v)).length;
  if (snakeCaseCount / profile.sampleValues.length > 0.5) {
    score += 0.1;
  }

  // Penalty: all numeric
  if (profile.allNumeric) score *= 0.1;

  // Penalty: high cardinality (event names should repeat)
  if (profile.cardinality > 0.9) score *= 0.3;

  return Math.min(score, 1.0);
}

function scoreSessionId(profile: ColumnProfile): number {
  if (profile.nonEmpty === 0) return 0;

  let score = 0;

  // High cardinality
  if (profile.cardinality > 0.7) {
    score += 0.35;
  } else if (profile.cardinality > 0.5) {
    score += 0.15;
  }

  // UUID or long alphanumeric pattern
  const values = profile.sampleValues;
  let patternHits = 0;
  for (const v of values) {
    if (UUID_REGEX.test(v) || ALNUM_LONG.test(v)) patternHits++;
  }
  const patternRate = patternHits / values.length;
  score += patternRate * 0.4;

  // Length in reasonable range for session IDs (6-40 chars)
  if (profile.avgLength >= 6 && profile.avgLength <= 40) {
    score += 0.15;
  }

  return Math.min(score, 1.0);
}

function scorePlatform(profile: ColumnProfile): number {
  if (profile.nonEmpty === 0) return 0;

  let score = 0;

  // Very low cardinality (2-10 unique values)
  if (profile.uniqueCount >= 2 && profile.uniqueCount <= 10) {
    score += 0.3;
  } else if (profile.uniqueCount > 10 && profile.uniqueCount <= 20) {
    score += 0.1;
  }

  // Known platform names
  const lowerValues = [...new Set(profile.sampleValues.map(v => v.toLowerCase()))];
  let knownHits = 0;
  for (const val of lowerValues) {
    if (KNOWN_PLATFORMS.some(p => val === p || val.includes(p))) knownHits++;
  }
  const knownRate = lowerValues.length > 0 ? knownHits / lowerValues.length : 0;
  score += knownRate * 0.6;

  // Penalty: all numeric
  if (profile.allNumeric) score *= 0.1;

  // Penalty: too many unique values
  if (profile.uniqueCount > 20) score *= 0.2;

  return Math.min(score, 1.0);
}

function scoreChannel(profile: ColumnProfile): number {
  if (profile.nonEmpty === 0) return 0;

  let score = 0;

  // Low cardinality (2-15 unique values)
  if (profile.uniqueCount >= 2 && profile.uniqueCount <= 15) {
    score += 0.3;
  } else if (profile.uniqueCount > 15 && profile.uniqueCount <= 30) {
    score += 0.1;
  }

  // Known channel names
  const lowerValues = [...new Set(profile.sampleValues.map(v => v.toLowerCase()))];
  let knownHits = 0;
  for (const val of lowerValues) {
    if (KNOWN_CHANNELS.some(c => val === c || val.includes(c))) knownHits++;
  }
  const knownRate = lowerValues.length > 0 ? knownHits / lowerValues.length : 0;
  score += knownRate * 0.6;

  // Penalty: all numeric
  if (profile.allNumeric) score *= 0.1;

  // Penalty: too many unique values
  if (profile.uniqueCount > 30) score *= 0.2;

  return Math.min(score, 1.0);
}

const SCORERS: Record<MappingKey, (profile: ColumnProfile) => number> = {
  timestamp: scoreTimestamp,
  userid: scoreUserId,
  eventname: scoreEventName,
  sessionid: scoreSessionId,
  platform: scorePlatform,
  channel: scoreChannel,
};

const THRESHOLD = 0.25;

interface ScoreEntry {
  header: string;
  mappingKey: MappingKey;
  score: number;
}

function assignColumns(
  profiles: ColumnProfile[],
  alreadyMapped: Set<string>
): Partial<ColumnMapping> {
  const candidateHeaders = profiles
    .filter(p => !alreadyMapped.has(p.header))
    .map(p => p.header);

  const mappingKeys: MappingKey[] = ['timestamp', 'userid', 'eventname', 'sessionid', 'platform', 'channel'];
  const unmappedKeys = mappingKeys.filter(k => !alreadyMapped.has(k));

  // Score every (header, mappingKey) pair
  const allScores: ScoreEntry[] = [];
  const profileMap = new Map(profiles.map(p => [p.header, p]));

  for (const header of candidateHeaders) {
    const profile = profileMap.get(header)!;
    for (const key of unmappedKeys) {
      const score = SCORERS[key](profile);
      if (score >= THRESHOLD) {
        allScores.push({ header, mappingKey: key, score });
      }
    }
  }

  // Sort by score descending
  allScores.sort((a, b) => b.score - a.score);

  // Disambiguation: if same header scores highly for both userid and sessionid,
  // use cardinality to decide
  const result: Partial<ColumnMapping> = {};
  const usedHeaders = new Set<string>();
  const usedKeys = new Set<MappingKey>();

  for (const entry of allScores) {
    if (usedHeaders.has(entry.header) || usedKeys.has(entry.mappingKey)) continue;
    result[entry.mappingKey] = entry.header;
    usedHeaders.add(entry.header);
    usedKeys.add(entry.mappingKey);
  }

  return result;
}

export function detectColumnsByValues(
  headers: string[],
  rawData: RawRow[],
  alreadyMapped: ColumnMapping
): ColumnMapping {
  const SAMPLE_SIZE = 100;

  // Build profiles for all headers
  const profiles = headers.map(h => buildColumnProfile(h, rawData, SAMPLE_SIZE));

  // Determine which mapping keys are already filled and which headers are already used
  const alreadyMappedKeys = new Set<string>();
  const alreadyMappedHeaders = new Set<string>();
  for (const [key, header] of Object.entries(alreadyMapped)) {
    if (header) {
      alreadyMappedKeys.add(key);
      alreadyMappedHeaders.add(header);
    }
  }

  // Build combined "already used" set (both key names and header values)
  const alreadyUsed = new Set([...alreadyMappedKeys, ...alreadyMappedHeaders]);

  const valueMapping = assignColumns(profiles, alreadyUsed);

  // Merge: Phase 1 results take priority
  const merged: ColumnMapping = { ...alreadyMapped };
  for (const [key, header] of Object.entries(valueMapping)) {
    const k = key as MappingKey;
    if (!merged[k]) {
      merged[k] = header;
    }
  }

  return merged;
}
