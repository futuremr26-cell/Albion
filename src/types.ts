export interface ColumnProfile {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'date';
  nullCount: number;
  distinctCount: number;
  sampleValues: any[];
  min?: number | string;
  max?: number | string;
  mean?: number;
}

export interface DataProfile {
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  previewRows: Record<string, any>[];
  allData: Record<string, any>[];
}

export interface KPIItem {
  id: string;
  name: string;
  definition: string;
  formula: string;
  columns_used: string[];
  why_it_matters: string;
  category?: string;
  targetDirection?: 'higher' | 'lower' | 'neutral';
}

export type SqlDialect = 'PostgreSQL' | 'MySQL' | 'BigQuery' | 'SQL Server';

export interface GeneratedSQL {
  kpiId: string;
  dialect: SqlDialect;
  sql: string;
  explanation: string;
  suggestedChart?: {
    type: 'bar' | 'line' | 'area' | 'pie';
    xKey: string;
    yKey: string;
    title?: string;
  };
  lastRunResult?: {
    success: boolean;
    data?: any[];
    error?: string;
    executionTimeMs?: number;
    columns?: string[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedSql?: string;
}

export type WidgetType = 'metric' | 'bar' | 'line' | 'area' | 'pie' | 'table';

export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  description?: string;
  sql: string;
  xKey?: string;
  yKey?: string;
  categoryCol?: string;
  // Execution status & cached run
  status?: 'idle' | 'running' | 'success' | 'error';
  data?: any[];
  error?: string;
  executionTimeMs?: number;
  columns?: string[];
  // For metric card
  metricValue?: string | number;
  metricLabel?: string;
  trendSubtext?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  width?: 'full' | 'half' | 'third';
}

export interface DashboardConfig {
  title: string;
  subtitle: string;
  widgets: DashboardWidget[];
  activeFilterColumn?: string;
  activeFilterValue?: string;
}
