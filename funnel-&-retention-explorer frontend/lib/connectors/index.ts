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
    labelKey: 'connector.ga4',
    descKey: 'connector.ga4Desc',
    iconName: 'BarChart2',
    inputType: 'file',
    acceptedFormats: '.csv,.json',
  },
  'mixpanel-export': {
    type: 'mixpanel-export',
    labelKey: 'connector.mixpanel',
    descKey: 'connector.mixpanelDesc',
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
};
