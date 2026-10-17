import React, { useState, useMemo } from 'react';
import { ChartConfig } from '../../types/data';
import { computeBarLineData } from '../../utils/chartDataCompute';
import { getPaletteColor } from '../../utils/colors';
import { formatValue, formatDateLabel } from '../../utils/formatting';

interface LineAreaChartComponentProps {
  rows: Record<string, any>[];
  config: ChartConfig;
  isArea?: boolean;
}

export const LineAreaChartComponent: React.FC<LineAreaChartComponentProps> = ({ rows, config, isArea = false }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { data, seriesKeys } = useMemo(() => computeBarLineData(rows, config), [rows, config]);

  const maxValue = useMemo(() => {
    if (data.length === 0) return 100;
    let max = 0;
    data.forEach((d) => {
      seriesKeys.forEach((k) => {
        if (d.values[k] > max) max = d.values[k];
      });
    });
    return max > 0 ? max * 1.15 : 100;
  }, [data, seriesKeys]);

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
        <span>No matching data for selected axes</span>
      </div>
    );
  }

  const padding = { top: 30, right: 24, bottom: 48, left: 70 };
  const width = 600;
  const height = 280;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Grid ticks
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (maxValue / tickCount) * i);

  // Generate SVG path for a series
  const getCoordinates = (seriesKey: string) => {
    return data.map((d, i) => {
      const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * innerWidth : innerWidth / 2);
      const val = d.values[seriesKey] || 0;
      const y = height - padding.bottom - (val / maxValue) * innerHeight;
      return { x, y, val, label: d.label };
    });
  };

  const buildPath = (points: { x: number; y: number }[], curve = config.curve || 'smooth') => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    if (curve === 'linear') {
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    }

    if (curve === 'step') {
      let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        path += ` H ${curr.x.toFixed(1)} V ${curr.y.toFixed(1)}`;
      }
      return path;
    }

    // Smooth cubic bezier
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  // Find hovered point when mouse moves across SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    if (mouseX < padding.left || mouseX > width - padding.right) {
      setHoverIndex(null);
      return;
    }

    const relX = mouseX - padding.left;
    const step = innerWidth / (data.length - 1 || 1);
    const index = Math.round(relX / step);
    setHoverIndex(Math.max(0, Math.min(data.length - 1, index)));
  };

  const hoveredPoint = hoverIndex !== null ? data[hoverIndex] : null;
  const hoveredX = hoverIndex !== null && data.length > 1
    ? padding.left + (hoverIndex / (data.length - 1)) * innerWidth
    : null;

  return (
    <div className="w-full h-full relative select-none flex flex-col">
      {/* Legend */}
      {config.showLegend && seriesKeys.length > 1 && (
        <div className="flex flex-wrap items-center gap-3 mb-2 px-1 text-xs text-slate-600">
          {seriesKeys.map((key, idx) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getPaletteColor(config.colorPalette, idx) }}
              />
              <span className="truncate max-w-[120px]">{key}</span>
            </div>
          ))}
        </div>
      )}

      {/* SVG Canvas */}
      <div className="flex-1 w-full relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {seriesKeys.map((key, idx) => {
              const color = getPaletteColor(config.colorPalette, idx);
              return (
                <linearGradient key={`grad-${key}`} id={`gradient-${config.id}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Grid lines */}
          {config.showGrid && (
            <g className="opacity-40">
              {yTicks.map((tick, i) => {
                const yPos = height - padding.bottom - (tick / maxValue) * innerHeight;
                return (
                  <line
                    key={i}
                    x1={padding.left}
                    y1={yPos}
                    x2={width - padding.right}
                    y2={yPos}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                );
              })}
            </g>
          )}

          {/* Y-Axis Value Labels */}
          <g className="text-[10px] fill-slate-400 font-mono tabular-nums">
            {yTicks.map((tick, i) => {
              const yPos = height - padding.bottom - (tick / maxValue) * innerHeight;
              return (
                <text key={i} x={padding.left - 10} y={yPos + 3} textAnchor="end">
                  {formatValue(tick, config.numberFormat)}
                </text>
              );
            })}
          </g>

          {/* Areas and Lines for each series */}
          {seriesKeys.map((seriesKey, sIdx) => {
            const points = getCoordinates(seriesKey);
            const linePath = buildPath(points, config.curve);
            const color = getPaletteColor(config.colorPalette, sIdx);

            let areaPath = '';
            if (isArea && points.length > 1) {
              const bottomY = height - padding.bottom;
              const first = points[0];
              const last = points[points.length - 1];
              areaPath = `${linePath} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
            }

            return (
              <g key={seriesKey}>
                {isArea && areaPath && (
                  <path d={areaPath} fill={`url(#gradient-${config.id}-${sIdx})`} />
                )}
                <path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Point dots */}
                {points.length <= 40 &&
                  points.map((p, pIdx) => (
                    <circle
                      key={pIdx}
                      cx={p.x}
                      cy={p.y}
                      r={hoverIndex === pIdx ? 4.5 : 2.5}
                      fill="#ffffff"
                      stroke={color}
                      strokeWidth={2}
                      className="transition-all"
                    />
                  ))}
              </g>
            );
          })}

          {/* Interactive Crosshair */}
          {hoveredX !== null && (
            <g>
              <line
                x1={hoveredX}
                y1={padding.top}
                x2={hoveredX}
                y2={height - padding.bottom}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            </g>
          )}

          {/* X-Axis Category Labels */}
          <g className="text-[10px] fill-slate-500 font-medium">
            {data.map((item, i) => {
              // Show fewer labels if too dense
              const step = Math.ceil(data.length / 7);
              if (i % step !== 0 && i !== data.length - 1) return null;

              const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * innerWidth : innerWidth / 2);
              return (
                <text key={i} x={x} y={height - padding.bottom + 16} textAnchor="middle">
                  {formatDateLabel(item.label)}
                </text>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredPoint && hoveredX !== null && (
          <div
            className="absolute pointer-events-none z-30 bg-slate-900 text-white rounded-lg shadow-xl px-3 py-2 text-xs -translate-x-1/2 top-4"
            style={{ left: `${(hoveredX / width) * 100}%` }}
          >
            <div className="font-semibold text-slate-100 pb-1 border-b border-slate-700/60 mb-1">
              {hoveredPoint.label}
            </div>
            <div className="space-y-1">
              {seriesKeys.map((k, sIdx) => (
                <div key={k} className="flex items-center justify-between gap-3 text-slate-300">
                  <span className="flex items-center gap-1.5 truncate max-w-[110px]">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: getPaletteColor(config.colorPalette, sIdx) }}
                    />
                    {k}:
                  </span>
                  <span className="font-mono tabular-nums font-medium text-white">
                    {formatValue(hoveredPoint.values[k], config.numberFormat)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
