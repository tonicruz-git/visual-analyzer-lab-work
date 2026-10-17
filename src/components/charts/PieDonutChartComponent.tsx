import React, { useState, useMemo } from 'react';
import { ChartConfig } from '../../types/data';
import { computePieData, PieSlice } from '../../utils/chartDataCompute';
import { getPaletteColor } from '../../utils/colors';
import { formatValue } from '../../utils/formatting';

interface PieDonutChartComponentProps {
  rows: Record<string, any>[];
  config: ChartConfig;
  onFilterSelect?: (col: string, val: string) => void;
}

export const PieDonutChartComponent: React.FC<PieDonutChartComponentProps> = ({
  rows,
  config,
  onFilterSelect,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const slices = useMemo(() => computePieData(rows, config), [rows, config]);
  const isDonut = config.type === 'donut';

  if (slices.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
        <span>No matching distribution data</span>
      </div>
    );
  }

  const size = 260;
  const center = size / 2;
  const radius = 95;
  const innerRadius = isDonut ? 55 : 0;

  // Compute angles for each slice
  let currentAngle = -Math.PI / 2; // start from top
  const arcData = slices.map((slice) => {
    const angle = (slice.percentage / 100) * (2 * Math.PI);
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Center point of arc for labels
    const midAngle = startAngle + angle / 2;
    const labelRadius = isDonut ? (radius + innerRadius) / 2 : radius * 0.65;
    const labelX = center + labelRadius * Math.cos(midAngle);
    const labelY = center + labelRadius * Math.sin(midAngle);

    // SVG path string for arc
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    let path = '';
    if (innerRadius > 0) {
      const ix1 = center + innerRadius * Math.cos(endAngle);
      const iy1 = center + innerRadius * Math.sin(endAngle);
      const ix2 = center + innerRadius * Math.cos(startAngle);
      const iy2 = center + innerRadius * Math.sin(startAngle);

      path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z`;
    } else {
      path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }

    return {
      slice,
      path,
      labelX,
      labelY,
      midAngle,
    };
  });

  const totalValue = slices.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      {/* SVG Container */}
      <div className="relative w-[240px] h-[200px] flex items-center justify-center shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
          <g>
            {arcData.map(({ slice, path, labelX, labelY, midAngle }, idx) => {
              const isHovered = hoveredIdx === idx;
              const color = getPaletteColor(config.colorPalette, slice.colorIndex);

              // Scale or offset hovered slice slightly
              const offsetX = isHovered ? Math.cos(midAngle) * 6 : 0;
              const offsetY = isHovered ? Math.sin(midAngle) * 6 : 0;

              return (
                <g
                  key={slice.label}
                  transform={`translate(${offsetX}, ${offsetY})`}
                  className="transition-transform duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onFilterSelect?.(config.xAxis, slice.label)}
                >
                  <path
                    d={path}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="transition-all hover:brightness-105"
                  />
                  {config.showValues && slice.percentage >= 8 && (
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[10px] font-semibold fill-white drop-shadow-sm font-mono tabular-nums pointer-events-none"
                    >
                      {slice.percentage.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Center text for donut */}
          {isDonut && (
            <g className="pointer-events-none select-none">
              <text
                x={center}
                y={center - 4}
                textAnchor="middle"
                className="text-[11px] font-medium fill-slate-400"
              >
                {hoveredIdx !== null ? slices[hoveredIdx].label : 'Total'}
              </text>
              <text
                x={center}
                y={center + 14}
                textAnchor="middle"
                className="text-xs font-bold fill-slate-800 font-mono tabular-nums"
              >
                {formatValue(
                  hoveredIdx !== null ? slices[hoveredIdx].value : totalValue,
                  config.numberFormat
                )}
              </text>
            </g>
          )}
        </svg>

        {/* Hover Tooltip for Slice */}
        {hoveredIdx !== null && !isDonut && (
          <div className="absolute top-2 bg-slate-900 text-white rounded-md px-2.5 py-1 text-xs shadow-lg pointer-events-none">
            <span className="font-semibold">{slices[hoveredIdx].label}</span>:{' '}
            {formatValue(slices[hoveredIdx].value, config.numberFormat)} (
            {slices[hoveredIdx].percentage.toFixed(1)}%)
          </div>
        )}
      </div>

      {/* Legend list below */}
      {config.showLegend && (
        <div className="w-full grid grid-cols-2 gap-x-2 gap-y-1 mt-2 pt-2 border-t border-slate-100 text-xs">
          {slices.map((slice, idx) => (
            <button
              key={slice.label}
              onClick={() => onFilterSelect?.(config.xAxis, slice.label)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between px-1.5 py-0.5 rounded transition-colors text-left cursor-pointer ${
                hoveredIdx === idx ? 'bg-slate-100 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getPaletteColor(config.colorPalette, slice.colorIndex) }}
                />
                <span className="truncate text-[11px]">{slice.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0 ml-1">
                {slice.percentage.toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
