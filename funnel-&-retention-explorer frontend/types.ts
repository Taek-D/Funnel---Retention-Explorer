export type View = 
  | 'dashboard' 
  | 'funnels' 
  | 'retention' 
  | 'upload' 
  | 'editor' 
  | 'segments' 
  | 'insights'
  | 'mobile';

export interface KPI {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}
