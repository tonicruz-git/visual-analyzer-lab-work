import React, { useMemo, useState } from 'react';
import { ChartConfig } from '../../types/data';
import { computeCorrelationMatrix } from '../../utils/chartDataCompute';

interface HeatmapComponentProps {
  rows: Record<string, any>[];
  config: ChartConfig;
  numericColumns: string[];
}

export const HeatmapComponent: React.FC<HeatmapComponentProps> = ({
  rows,
  config: _config,
  numericColumns,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    xCol: string;
    yCol: string;
    val: number;
  } | null>(null);

  const { cols, matrix } = useMemo(() => {
    return computeCorrelationMatrix(rows, numericColumns);
  }, [rows, numericColumns]);

  if (cols.length < 2) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
        <span>At least 2 numeric columns required for correlation matrix</span>
      </div>
    );
  }

  // Get color for correlation value [-1 .. 1]
  const getCellColor = (val: number) => {
    if (val === 1) return '#4f46e5'; // diagonal perfect self-correlation
    if (val > 0) {
      // positive correlation: emerald or indigo
      const opacity = Math.min(1, Math.max(0.1, val));
      return `rgba(79, 70, 229, ${opacity * 0.85})`;
    } else {
      // negative correlation: rose/red
      const opacity = Math.min(1, Math.max(0.1, Math.abs(val)));
      return `rgba(225, 29, 72, ${opacity * 0.85})`;
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-auto p-1">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-1.5 text-left text-[11px] font-medium text-slate-400 shrink-0"></th>
              {cols.map((col) => (
                <th
                  key={col}
                  className="p-1.5 text-center text-[10px] font-medium text-slate-600 truncate max-w-[80px]"
                  title={col}
                >
                  {col.length > 9 ? `${col.substring(0, 8)}…` : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cols.map((rowCol, rIdx) => (
              <tr key={rowCol}>
                <td className="p-1.5 text-right text-[10px] font-medium text-slate-600 truncate max-w-[85px]" title={rowCol}>
                  {rowCol.length > 10 ? `${rowCol.substring(0, 9)}…` : rowCol}
                </td>
                {cols.map((colCol, cIdx) => {
                  const val = matrix[rIdx] ? matrix[rIdx][cIdx] : 0;
                  const isHovered =
                    hoveredCell?.xCol === colCol && hoveredCell?.yCol === rowCol;

                  return (
                    <td
                      key={colCol}
                      className="p-1 text-center"
                      onMouseEnter={() => setHoveredCell({ xCol: colCol, yCol: rowCol, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className={`h-8 rounded flex items-center justify-center font-mono tabular-nums text-[10px] font-semibold transition-all cursor-pointer ${
                          isHovered ? 'ring-2 ring-slate-900 shadow-sm' : ''
                        }`}
                        style={{
                          backgroundColor: getCellColor(val),
                          color: Math.abs(val) > 0.45 ? '#ffffff' : '#334155',
                        }}
                      >
                        {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info status footer */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
            <span>Negative (-1.0)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 shrink-0" />
            <span>Positive (+1.0)</span>
          </div>
        </div>
        {hoveredCell && (
          <span className="font-mono text-slate-700 font-medium">
            {hoveredCell.xCol} ↔ {hoveredCell.yCol}: {hoveredCell.val}
          </span>
        )}
      </div>
    </div>
  );
};
