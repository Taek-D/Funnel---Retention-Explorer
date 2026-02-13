import { describe, it, expect } from 'vitest';
import { CONNECTORS, PRO_CONNECTOR_TYPES, ENTERPRISE_CONNECTOR_TYPES } from '../../lib/connectors';
import type { ConnectorType } from '../../types';

describe('CONNECTORS registry', () => {
  it('has 10 connector types', () => {
    expect(Object.keys(CONNECTORS)).toHaveLength(10);
  });

  it('contains all base connector types', () => {
    const types: ConnectorType[] = ['csv', 'json', 'google-sheets', 'ga4-export', 'mixpanel-export', 'amplitude-export'];
    for (const type of types) {
      expect(CONNECTORS[type]).toBeDefined();
    }
  });

  it('contains all pro connector types', () => {
    expect(CONNECTORS['ga4-api']).toBeDefined();
    expect(CONNECTORS['mixpanel-api']).toBeDefined();
  });

  it('contains all enterprise connector types', () => {
    expect(CONNECTORS['postgresql']).toBeDefined();
    expect(CONNECTORS['mysql']).toBeDefined();
  });

  it('pro connectors have planGate = pro', () => {
    expect(CONNECTORS['ga4-api'].planGate).toBe('pro');
    expect(CONNECTORS['mixpanel-api'].planGate).toBe('pro');
  });

  it('enterprise connectors have planGate = enterprise', () => {
    expect(CONNECTORS['postgresql'].planGate).toBe('enterprise');
    expect(CONNECTORS['mysql'].planGate).toBe('enterprise');
  });

  it('free connectors have no planGate', () => {
    expect(CONNECTORS['csv'].planGate).toBeUndefined();
    expect(CONNECTORS['json'].planGate).toBeUndefined();
    expect(CONNECTORS['google-sheets'].planGate).toBeUndefined();
  });

  it('ga4-api has inputType = oauth', () => {
    expect(CONNECTORS['ga4-api'].inputType).toBe('oauth');
  });

  it('mixpanel-api has inputType = credentials', () => {
    expect(CONNECTORS['mixpanel-api'].inputType).toBe('credentials');
  });

  it('postgresql has inputType = credentials', () => {
    expect(CONNECTORS['postgresql'].inputType).toBe('credentials');
  });

  it('mysql has inputType = credentials', () => {
    expect(CONNECTORS['mysql'].inputType).toBe('credentials');
  });

  it('file connectors have inputType = file', () => {
    expect(CONNECTORS['csv'].inputType).toBe('file');
    expect(CONNECTORS['json'].inputType).toBe('file');
  });

  it('google-sheets has inputType = url', () => {
    expect(CONNECTORS['google-sheets'].inputType).toBe('url');
  });

  it('every connector has required fields', () => {
    for (const [key, config] of Object.entries(CONNECTORS)) {
      expect(config.type).toBe(key);
      expect(config.labelKey).toBeTruthy();
      expect(config.descKey).toBeTruthy();
      expect(config.iconName).toBeTruthy();
      expect(['file', 'url', 'oauth', 'credentials']).toContain(config.inputType);
    }
  });
});

describe('PRO_CONNECTOR_TYPES', () => {
  it('contains ga4-api and mixpanel-api', () => {
    expect(PRO_CONNECTOR_TYPES).toEqual(['ga4-api', 'mixpanel-api']);
  });
});

describe('ENTERPRISE_CONNECTOR_TYPES', () => {
  it('contains postgresql and mysql', () => {
    expect(ENTERPRISE_CONNECTOR_TYPES).toEqual(['postgresql', 'mysql']);
  });
});
