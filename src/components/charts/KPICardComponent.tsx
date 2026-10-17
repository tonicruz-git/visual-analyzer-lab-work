import React, { useMemo } from 'react';
import { ChartConfig, AggregationType } from '../../types/data';
import { aggregateValues } from '../../utils/chartDataCompute';
import { formatValue } from '../../utils/formatting';
import { PALETTES } from '../../utils/colors';

interface KPICardComponentProps {
  rows: Record<string, any>[];
  config: ChartConfig;
  onUpdateAggregation?: (agg: AggregationType) => void;
}

export const KPICardComponent: React.FC<KPICardComponentProps> = ({
  rows,
  config,
  onUpdateAggregation,
}) => {
  const numericValues = useMemo(() => {
    return rows.map((r) => Number(r[config.yAxis])).filter((v) => !isNaN(v));
  }, [rows, config.yAxis]);

  const value = useMemo(() => {
    return aggregateValues(numericValues, config.aggregation);
  }, [numericValues, config.aggregation]);

  // Generate sparkline path
  const sparkline = useMemo(() => {
    if (numericValues.length < 2) return null;
    const sampled = numericValues.slice(0, 30);
    const min = Math.min(...sampled);
    const max = Math.max(...sampled);
    const range = max - min || 1;

    const width = 200;
    const height = 48;

    const points = sampled.map((v, i) => {
      const x = (i / (sampled.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  }, [numericValues]);

  const palette = PALETTES[config.colorPalette] || PALETTES.indigo;
  const aggregations: AggregationType[] = ['sum', 'mean', 'count', 'min', 'max'];

  return (
    <div className="w-full h-full flex flex-col justify-between p-2">
      {/* Top Controls: Aggregation switcher */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs text-slate-500 font-medium">{config.yAxis}</span>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
          {aggregations.map((agg) => (
            <button
              key={agg}
              onClick={() => onUpdateAggregation?.(agg)}
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer uppercase ${
                config.aggregation === agg
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {agg === 'mean' ? 'avg' : agg}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="my-auto py-2">
        <div className="text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {formatValue(value, config.numberFormat)}
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
          <span>Based on {rows.length.toLocaleString()} records</span>
        </div>
      </div>

      {/* Sparkline curve */}
      {sparkline && (
        <div className="w-full h-12 mt-2 pt-2 border-t border-slate-100">
          <svg viewBox="0 0 200 48" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <path
              d={sparkline}
              fill="none"
              stroke={palette.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
