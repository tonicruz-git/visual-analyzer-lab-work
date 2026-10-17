import React, { useState, useMemo } from 'react';
import { ChartConfig } from '../../types/data';
import { computeScatterData, ScatterPoint } from '../../utils/chartDataCompute';
import { getPaletteColor } from '../../utils/colors';
import { formatValue } from '../../utils/formatting';

interface ScatterChartComponentProps {
  rows: Record<string, any>[];
  config: ChartConfig;
  onFilterSelect?: (col: string, val: string) => void;
}

export const ScatterChartComponent: React.FC<ScatterChartComponentProps> = ({
  rows,
  config,
  onFilterSelect,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: ScatterPoint;
    posX: number;
    posY: number;
  } | null>(null);

  const points = useMemo(() => computeScatterData(rows, config), [rows, config]);

  const { xMin, xMax, yMin, yMax, groupList } = useMemo(() => {
    if (points.length === 0) {
      return { xMin: 0, xMax: 100, yMin: 0, yMax: 100, groupList: [] };
    }

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const groups = Array.from(new Set(points.map((p) => p.group)));

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const xPad = (maxX - minX) * 0.08 || 1;
    const yPad = (maxY - minY) * 0.08 || 1;

    return {
      xMin: minX - xPad,
      xMax: maxX + xPad,
      yMin: minY - yPad,
      yMax: maxY + yPad,
      groupList: groups,
    };
  }, [points]);

  const padding = { top: 30, right: 24, bottom: 44, left: 70 };
  const width = 600;
  const height = 280;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  if (points.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
        <span>No numeric scatter coordinates available</span>
      </div>
    );
  }

  // Size normalizer
  const sizes = points.map((p) => p.size);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  const getRadius = (s: number) => {
    if (minSize === maxSize) return 5;
    return 4 + ((s - minSize) / (maxSize - minSize)) * 12;
  };

  const xTicks = Array.from({ length: 5 }, (_, i) => xMin + ((xMax - xMin) / 4) * i);
  const yTicks = Array.from({ length: 4 }, (_, i) => yMin + ((yMax - yMin) / 3) * i);

  return (
    <div className="w-full h-full relative select-none flex flex-col">
      {/* Legend for Groups */}
      {config.showLegend && groupList.length > 1 && (
        <div className="flex flex-wrap items-center gap-3 mb-2 px-1 text-xs text-slate-600">
          {groupList.slice(0, 6).map((grp, idx) => (
            <button
              key={grp}
              onClick={() => config.groupBy && onFilterSelect?.(config.groupBy, grp)}
              className="flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getPaletteColor(config.colorPalette, idx) }}
              />
              <span className="truncate max-w-[120px]">{grp}</span>
            </button>
          ))}
        </div>
      )}

      {/* SVG Canvas */}
      <div className="flex-1 w-full relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {config.showGrid && (
            <g className="opacity-40">
              {yTicks.map((tick, i) => {
                const yPos = height - padding.bottom - ((tick - yMin) / (yMax - yMin)) * innerHeight;
                return (
                  <line
                    key={`y-${i}`}
                    x1={padding.left}
                    y1={yPos}
                    x2={width - padding.right}
                    y2={yPos}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                );
              })}
              {xTicks.map((tick, i) => {
                const xPos = padding.left + ((tick - xMin) / (xMax - xMin)) * innerWidth;
                return (
                  <line
                    key={`x-${i}`}
                    x1={xPos}
                    y1={padding.top}
                    x2={xPos}
                    y2={height - padding.bottom}
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
              const yPos = height - padding.bottom - ((tick - yMin) / (yMax - yMin)) * innerHeight;
              return (
                <text key={i} x={padding.left - 10} y={yPos + 3} textAnchor="end">
                  {formatValue(tick, config.numberFormat)}
                </text>
              );
            })}
          </g>

          {/* X-Axis Value Labels */}
          <g className="text-[10px] fill-slate-400 font-mono tabular-nums">
            {xTicks.map((tick, i) => {
              const xPos = padding.left + ((tick - xMin) / (xMax - xMin)) * innerWidth;
              return (
                <text key={i} x={xPos} y={height - padding.bottom + 16} textAnchor="middle">
                  {formatValue(tick, 'compact')}
                </text>
              );
            })}
          </g>

          {/* Scatter Points */}
          <g>
            {points.map((pt, i) => {
              const cx = padding.left + ((pt.x - xMin) / (xMax - xMin)) * innerWidth;
              const cy = height - padding.bottom - ((pt.y - yMin) / (yMax - yMin)) * innerHeight;
              const r = getRadius(pt.size);
              const gIdx = groupList.indexOf(pt.group);
              const color = getPaletteColor(config.colorPalette, gIdx >= 0 ? gIdx : 0);

              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={color}
                  fillOpacity={0.65}
                  stroke={color}
                  strokeWidth={1.5}
                  className="transition-transform duration-100 cursor-pointer hover:stroke-slate-900 hover:fill-opacity-95"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredPoint({
                      point: pt,
                      posX: rect.x + rect.width / 2,
                      posY: rect.y,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => config.groupBy && onFilterSelect?.(config.groupBy, pt.group)}
                />
              );
            })}
          </g>
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="fixed pointer-events-none z-50 bg-slate-900 text-white rounded-lg shadow-xl px-3 py-2 text-xs -translate-x-1/2 -translate-y-full mb-2"
            style={{ left: hoveredPoint.posX, top: hoveredPoint.posY - 6 }}
          >
            {hoveredPoint.point.group !== 'Default' && (
              <div className="font-semibold text-slate-100 pb-1 mb-1 border-b border-slate-700">
                {hoveredPoint.point.group}
              </div>
            )}
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>{config.xAxis}:</span>
              <span className="font-mono tabular-nums text-white font-medium">
                {formatValue(hoveredPoint.point.x, config.numberFormat)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>{config.yAxis}:</span>
              <span className="font-mono tabular-nums text-white font-medium">
                {formatValue(hoveredPoint.point.y, config.numberFormat)}
              </span>
            </div>
            {config.sizeField && (
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span>{config.sizeField}:</span>
                <span className="font-mono tabular-nums text-white font-medium">
                  {formatValue(hoveredPoint.point.size, 'compact')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
