import React from 'react';
import { ColumnMeta } from '../types/data';
import { formatValue } from '../utils/formatting';
import { Database, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';

interface MetricSummaryStripProps {
  totalRows: number;
  filteredRows: Record<string, any>[];
  columns: ColumnMeta[];
}

export const MetricSummaryStrip: React.FC<MetricSummaryStripProps> = ({
  totalRows,
  filteredRows,
  columns,
}) => {
  const numericCols = columns.filter((c) => c.type === 'number');
  const categoricalCols = columns.filter((c) => c.type === 'string' || c.type === 'boolean');

  // Primary metric (first numeric column with highest sum)
  const primaryCol = numericCols[0];
  const primarySum = primaryCol
    ? filteredRows.reduce((acc, r) => acc + (Number(r[primaryCol.name]) || 0), 0)
    : 0;

  // Secondary metric (second numeric col if exists, else average of first)
  const secondaryCol = numericCols[1] || primaryCol;
  const secondaryAvg = secondaryCol && filteredRows.length > 0
    ? filteredRows.reduce((acc, r) => acc + (Number(r[secondaryCol.name]) || 0), 0) / filteredRows.length
    : 0;

  const primaryCat = categoricalCols[0];
  const distinctCats = primaryCat
    ? new Set(filteredRows.map((r) => r[primaryCat.name])).size
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Records in Scope */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Dataset Records</span>
          <Database className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
          {filteredRows.length.toLocaleString()}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {Math.round((filteredRows.length / (totalRows || 1)) * 100)}% of {totalRows.toLocaleString()} total
        </div>
      </div>

      {/* Card 2: Primary Total */}
      {primaryCol && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium truncate">Total {primaryCol.name}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatValue(primarySum, 'compact')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sum of filtered scope
          </div>
        </div>
      )}

      {/* Card 3: Secondary Average */}
      {secondaryCol && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium truncate">Avg {secondaryCol.name}</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatValue(secondaryAvg, 'decimal')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Mean per record
          </div>
        </div>
      )}

      {/* Card 4: Categories */}
      {primaryCat && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium truncate">Active {primaryCat.name}</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {distinctCats}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Distinct segments present
          </div>
        </div>
      )}
    </div>
  );
};
