import React from 'react';
import { ChartConfig } from '../../types/data';
import { BarChartComponent } from './BarChartComponent';
import { LineAreaChartComponent } from './LineAreaChartComponent';
import { PieDonutChartComponent } from './PieDonutChartComponent';
import { ScatterChartComponent } from './ScatterChartComponent';
import { HistogramComponent } from './HistogramComponent';
import { HeatmapComponent } from './HeatmapComponent';
import { KPICardComponent } from './KPICardComponent';
import { RadarChartComponent } from './RadarChartComponent';

interface ChartRendererProps {
  config: ChartConfig;
  rows: Record<string, any>[];
  numericColumns: string[];
  onFilterSelect?: (col: string, val: string) => void;
  onFilterRange?: (col: string, min: number, max: number) => void;
  onUpdateAggregation?: (agg: any) => void;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  config,
  rows,
  numericColumns,
  onFilterSelect,
  onFilterRange,
  onUpdateAggregation,
}) => {
  switch (config.type) {
    case 'bar':
      return <BarChartComponent rows={rows} config={config} onFilterSelect={onFilterSelect} />;

    case 'line':
      return <LineAreaChartComponent rows={rows} config={config} isArea={false} />;

    case 'area':
      return <LineAreaChartComponent rows={rows} config={config} isArea={true} />;

    case 'pie':
    case 'donut':
      return <PieDonutChartComponent rows={rows} config={config} onFilterSelect={onFilterSelect} />;

    case 'scatter':
      return <ScatterChartComponent rows={rows} config={config} onFilterSelect={onFilterSelect} />;

    case 'histogram':
      return <HistogramComponent rows={rows} config={config} onFilterRange={onFilterRange} />;

    case 'heatmap':
      return <HeatmapComponent rows={rows} config={config} numericColumns={numericColumns} />;

    case 'kpi':
      return (
        <KPICardComponent
          rows={rows}
          config={config}
          onUpdateAggregation={onUpdateAggregation}
        />
      );

    case 'radar':
      return <RadarChartComponent rows={rows} config={config} />;

    default:
      return <BarChartComponent rows={rows} config={config} onFilterSelect={onFilterSelect} />;
  }
};
