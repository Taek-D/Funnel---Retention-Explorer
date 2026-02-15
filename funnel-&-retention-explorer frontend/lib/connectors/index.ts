import type { ConnectorConfig, ConnectorType } from '../../types';

export const CONNECTORS: Record<ConnectorType, ConnectorConfig> = {
  csv: {
    type: 'csv',
    labelKey: 'connector.csv',
    descKey: 'connector.csvDesc',
    iconName: 'FileText',
    inputType: 'file',
    acceptedFormats: '.csv',
  },
  json: {
    type: 'json',
    labelKey: 'connector.json',
    descKey: 'connector.jsonDesc',
    iconName: 'Braces',
    inputType: 'file',
    acceptedFormats: '.json',
  },
  'google-sheets': {
    type: 'google-sheets',
    labelKey: 'connector.googleSheets',
    descKey: 'connector.googleSheetsDesc',
    iconName: 'Sheet',
    inputType: 'url',
  },
  'ga4-export': {
    type: 'ga4-export',
    labelKey: 'connector.ga4Export',
    descKey: 'connector.ga4ExportDesc',
    iconName: 'BarChart2',
    inputType: 'file',
    acceptedFormats: '.csv,.json',
  },
  'mixpanel-export': {
    type: 'mixpanel-export',
    labelKey: 'connector.mixpanelExport',
    descKey: 'connector.mixpanelExportDesc',
    iconName: 'Activity',
    inputType: 'file',
    acceptedFormats: '.csv,.json',
  },
  'amplitude-export': {
    type: 'amplitude-export',
    labelKey: 'connector.amplitude',
    descKey: 'connector.amplitudeDesc',
    iconName: 'TrendingUp',
    inputType: 'file',
    acceptedFormats: '.csv,.json',
  },
  'ga4-api': {
    type: 'ga4-api',
    labelKey: 'connector.ga4Api',
    descKey: 'connector.ga4ApiDesc',
    iconName: 'BarChart2',
    inputType: 'oauth',
    planGate: 'pro',
  },
  'mixpanel-api': {
    type: 'mixpanel-api',
    labelKey: 'connector.mixpanelApi',
    descKey: 'connector.mixpanelApiDesc',
    iconName: 'Activity',
    inputType: 'credentials',
    planGate: 'pro',
  },
  postgresql: {
    type: 'postgresql',
    labelKey: 'connector.postgresql',
    descKey: 'connector.postgresqlDesc',
    iconName: 'Database',
    inputType: 'credentials',
    planGate: 'enterprise',
  },
  mysql: {
    type: 'mysql',
    labelKey: 'connector.mysql',
    descKey: 'connector.mysqlDesc',
    iconName: 'Database',
    inputType: 'credentials',
    planGate: 'enterprise',
  },
};

/** Pro/Enterprise connector types that require plan gating */
export const PRO_CONNECTOR_TYPES: ConnectorType[] = ['ga4-api', 'mixpanel-api'];
export const ENTERPRISE_CONNECTOR_TYPES: ConnectorType[] = ['postgresql', 'mysql'];
