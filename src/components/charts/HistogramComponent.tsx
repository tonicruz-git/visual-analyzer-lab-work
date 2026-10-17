import React, { useState, useMemo } from 'react';
import { ChartConfig } from '../../types/data';
import { computeHistogramData, HistogramBin } from '../../utils/chartDataCompute';
import { getPaletteColor } from '../../utils/colors';

interface HistogramComponentProps {
  rows: Record<string, any>[];
  config: ChartConfig;
  onFilterRange?: (col: string, min: number, max: number) => void;
}

export const HistogramComponent: React.FC<HistogramComponentProps> = ({
  rows,
  config,
  onFilterRange,
}) => {
  const [hoveredBin, setHoveredBin] = useState<HistogramBin | null>(null);

  const bins = useMemo(() => computeHistogramData(rows, config, 10), [rows, config]);

  const maxCount = useMemo(() => {
    if (bins.length === 0) return 10;
    return Math.max(...bins.map((b) => b.count), 1);
  }, [bins]);

  if (bins.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
        <span>No numeric data to generate histogram</span>
      </div>
    );
  }

  const padding = { top: 30, right: 24, bottom: 44, left: 60 };
  const width = 600;
  const height = 280;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  return (
    <div className="w-full h-full relative select-none flex flex-col">
      <div className="flex-1 w-full relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {config.showGrid && (
            <g className="opacity-40">
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = height - padding.bottom - pct * innerHeight;
                return (
                  <line
                    key={i}
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                );
              })}
            </g>
          )}

          {/* Y Axis counts */}
          <g className="text-[10px] fill-slate-400 font-mono tabular-nums">
            {[0, 0.5, 1].map((pct, i) => {
              const y = height - padding.bottom - pct * innerHeight;
              return (
                <text key={i} x={padding.left - 8} y={y + 3} textAnchor="end">
                  {Math.round(pct * maxCount)}
                </text>
              );
            })}
          </g>

          {/* Histogram Bins */}
          <g>
            {bins.map((bin, i) => {
              const binW = innerWidth / bins.length;
              const x = padding.left + i * binW;
              const barH = (bin.count / maxCount) * innerHeight;
              const y = height - padding.bottom - barH;
              const color = getPaletteColor(config.colorPalette, 0);

              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredBin(bin)}
                  onMouseLeave={() => setHoveredBin(null)}
                  onClick={() => onFilterRange?.(config.xAxis, bin.binStart, bin.binEnd)}
                >
                  <rect
                    x={x + 1}
                    y={y}
                    width={Math.max(2, binW - 2)}
                    height={Math.max(0, barH)}
                    rx={2}
                    fill={color}
                    className="transition-all hover:brightness-110"
                  />

                  {/* Bin text label */}
                  {(i === 0 || i === Math.floor(bins.length / 2) || i === bins.length - 1) && (
                    <text
                      x={x + binW / 2}
                      y={height - padding.bottom + 18}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-500 font-mono tabular-nums"
                    >
                      {bin.binStart.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hovered details */}
        {hoveredBin && (
          <div className="absolute top-2 right-2 bg-slate-900 text-white rounded-md px-2.5 py-1 text-xs shadow-md pointer-events-none">
            Range: <span className="font-mono">{hoveredBin.label}</span> — Frequency:{' '}
            <span className="font-bold text-white font-mono">{hoveredBin.count}</span> records
          </div>
        )}
      </div>
    </div>
  );
};
