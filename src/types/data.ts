/**
 * Types for Visual Analyzer
 */

export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  sampleValues: any[];
  uniqueCount: number;
  nullCount: number;
  min?: number | string;
  max?: number | string;
  avg?: number;
  median?: number;
  sum?: number;
  distinctValues: string[];
}

export interface Dataset {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnMeta[];
  rows: Record<string, any>[];
  source: 'upload' | 'sample' | 'paste';
  createdAt: string;
  fileSize?: string;
}

export type ChartType = 
  | 'bar' 
  | 'line' 
  | 'area' 
  | 'scatter' 
  | 'pie' 
  | 'donut' 
  | 'histogram' 
  | 'kpi' 
  | 'heatmap' 
  | 'radar' 
  | 'box';

export type AggregationType = 'sum' | 'mean' | 'count' | 'min' | 'max' | 'median';

export type ColorPalette = 'slate' | 'emerald' | 'blue' | 'indigo' | 'amber' | 'sunset' | 'purple';

export type NumberFormat = 'auto' | 'currency' | 'percent' | 'compact' | 'decimal';

export interface ChartConfig {
  id: string;
  title: string;
  subtitle?: string;
  type: ChartType;
  xAxis: string;
  yAxis: string;
  groupBy?: string; // Series or category split
  sizeField?: string; // For scatter bubble size
  aggregation: AggregationType;
  colorPalette: ColorPalette;
  isStacked?: boolean;
  isHorizontal?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showValues?: boolean;
  curve?: 'smooth' | 'linear' | 'step';
  numberFormat?: NumberFormat;
  sortOrder?: 'none' | 'asc' | 'desc' | 'alphabetical';
  topN?: number | 'all';
  width: '1/3' | '1/2' | '2/3' | 'full';
  height?: number;
}

export interface FilterState {
  search: string;
  numericRanges: Record<string, { min: number; max: number; currentMin: number; currentMax: number }>;
  categoricalSelections: Record<string, string[]>; // Set of selected values (empty means all)
  dateRanges: Record<string, { start: string; end: string }>;
}
