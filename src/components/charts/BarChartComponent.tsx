import React, { useState, useMemo } from 'react';
import { ChartConfig } from '../../types/data';
import { computeBarLineData } from '../../utils/chartDataCompute';
import { getPaletteColor } from '../../utils/colors';
import { formatValue } from '../../utils/formatting';

interface BarChartComponentProps {
  rows: Record<string, any>[];
  config: ChartConfig;
  onFilterSelect?: (col: string, val: string) => void;
}

function formatLabelIntoRows(label: string, maxRowChars = 11): string[] {
  if (!label) return [''];
  if (label.length <= maxRowChars) return [label];

  const words = label.trim().split(/\s+/);
  if (words.length > 1) {
    if (words.length === 2) {
      return [words[0], words[1]];
    }
    const half = Math.ceil(words.length / 2);
    const row1 = words.slice(0, half).join(' ');
    const row2 = words.slice(half).join(' ');
    return [row1, row2];
  }

  // Single long word
  if (label.length > maxRowChars + 2) {
    return [label.substring(0, maxRowChars), label.substring(maxRowChars)];
  }

  return [label];
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({ rows, config, onFilterSelect }) => {
  const [hovered, setHovered] = useState<{
    xLabel: string;
    series: string;
    value: number;
    posX: number;
    posY: number;
  } | null>(null);

  const { data, seriesKeys } = useMemo(() => computeBarLineData(rows, config), [rows, config]);

  const isHorizontal = !!config.isHorizontal;
  const isStacked = !!config.isStacked;

  // Max value calculation
  const maxValue = useMemo(() => {
    if (data.length === 0) return 100;
    if (isStacked) {
      return Math.max(...data.map((d) => d.rawTotal), 1);
    }
    let max = 0;
    data.forEach((d) => {
      seriesKeys.forEach((k) => {
        if (d.values[k] > max) max = d.values[k];
      });
    });
    return max > 0 ? max * 1.15 : 100;
  }, [data, seriesKeys, isStacked]);

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
        <span>No matching data for selected axes</span>
      </div>
    );
  }

  // Vertical layout dimensions with generous margins to accommodate 2-row labels
  const padding = { top: 30, right: 24, bottom: data.length > 7 ? 62 : 54, left: 70 };
  const width = 600;
  const height = 285;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Grid ticks
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (maxValue / tickCount) * i);

  return (
    <div className="w-full h-full relative select-none flex flex-col">
      {/* Legend if multiple series */}
      {config.showLegend && seriesKeys.length > 1 && (
        <div className="flex flex-wrap items-center gap-3 mb-2 px-1 text-xs text-slate-600">
          {seriesKeys.map((key, idx) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
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
        >
          {/* Grid lines */}
          {config.showGrid && (
            <g className="opacity-40">
              {yTicks.map((tick, i) => {
                const yPos = isHorizontal
                  ? padding.left + (tick / maxValue) * innerWidth
                  : height - padding.bottom - (tick / maxValue) * innerHeight;

                return isHorizontal ? (
                  <line
                    key={i}
                    x1={yPos}
                    y1={padding.top}
                    x2={yPos}
                    y2={height - padding.bottom}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                ) : (
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

          {/* Value Ticks Text */}
          <g className="text-[10px] fill-slate-400 font-mono tabular-nums">
            {yTicks.map((tick, i) => {
              if (isHorizontal) {
                const xPos = padding.left + (tick / maxValue) * innerWidth;
                return (
                  <text key={i} x={xPos} y={height - 12} textAnchor="middle">
                    {formatValue(tick, config.numberFormat)}
                  </text>
                );
              }
              const yPos = height - padding.bottom - (tick / maxValue) * innerHeight;
              return (
                <text key={i} x={padding.left - 10} y={yPos + 3} textAnchor="end">
                  {formatValue(tick, config.numberFormat)}
                </text>
              );
            })}
          </g>

          {/* Bars */}
          {!isHorizontal ? (
            // Vertical Bars
            <g>
              {data.map((item, itemIdx) => {
                const slotWidth = innerWidth / data.length;
                const slotX = padding.left + itemIdx * slotWidth;
                const barSpacing = slotWidth * 0.2;
                const barAreaWidth = slotWidth - barSpacing;

                let cumulativeY = 0;
                const isAngled = data.length > 7;

                return (
                  <g key={item.label} className="cursor-pointer">
                    {seriesKeys.map((seriesKey, sIdx) => {
                      const val = item.values[seriesKey] || 0;
                      const barH = (val / maxValue) * innerHeight;
                      const color = getPaletteColor(config.colorPalette, sIdx);

                      let barX: number;
                      let barW: number;
                      let barY: number;

                      if (isStacked) {
                        barX = slotX + barSpacing / 2;
                        barW = barAreaWidth;
                        barY = height - padding.bottom - cumulativeY - barH;
                        cumulativeY += barH;
                      } else {
                        const subBarW = barAreaWidth / seriesKeys.length;
                        barX = slotX + barSpacing / 2 + sIdx * subBarW;
                        barW = Math.max(2, subBarW - 2);
                        barY = height - padding.bottom - barH;
                      }

                      return (
                        <rect
                          key={seriesKey}
                          x={barX}
                          y={Math.max(padding.top, barY)}
                          width={barW}
                          height={Math.max(0, barH)}
                          rx={3}
                          fill={color}
                          className="transition-all duration-150 hover:brightness-110"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHovered({
                              xLabel: item.label,
                              series: seriesKey,
                              value: val,
                              posX: rect.x + rect.width / 2,
                              posY: rect.y,
                            });
                          }}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => onFilterSelect?.(config.xAxis, item.label)}
                        />
                      );
                    })}

                    {/* X Category Label (Multi-line 2 rows instead of truncating) */}
                    {(() => {
                      const labelRows = formatLabelIntoRows(item.label, 11);
                      const isMulti = labelRows.length > 1;
                      const baseY = height - padding.bottom + (isAngled ? 14 : (isMulti ? 14 : 18));

                      return (
                        <text
                          x={slotX + slotWidth / 2}
                          y={baseY}
                          textAnchor={isAngled ? 'end' : 'middle'}
                          transform={isAngled ? `rotate(-28, ${slotX + slotWidth / 2}, ${baseY})` : undefined}
                          className="text-[10px] fill-slate-600 font-medium tracking-tight select-none"
                        >
                          {labelRows.map((line, lIdx) => (
                            <tspan
                              key={lIdx}
                              x={slotX + slotWidth / 2}
                              dy={lIdx === 0 ? 0 : 12}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      );
                    })()}
                  </g>
                );
              })}
            </g>
          ) : (
            // Horizontal Bars
            <g>
              {data.map((item, itemIdx) => {
                const labelWidth = 85;
                const slotHeight = innerHeight / data.length;
                const slotY = padding.top + itemIdx * slotHeight;
                const barH = Math.max(6, slotHeight * 0.65);
                const val = item.rawTotal;
                const availableBarWidth = innerWidth - labelWidth;
                const barW = Math.max(2, (val / maxValue) * availableBarWidth);
                const color = getPaletteColor(config.colorPalette, 0);

                const yRows = formatLabelIntoRows(item.label, 12);
                const isMulti = yRows.length > 1;
                const baseY = isMulti ? slotY + slotHeight / 2 - 2 : slotY + slotHeight / 2 + 4;

                return (
                  <g
                    key={item.label}
                    className="cursor-pointer"
                    onClick={() => onFilterSelect?.(config.xAxis, item.label)}
                  >
                    {/* Y Category Label (Multi-line 2 rows instead of truncating) */}
                    <text
                      x={padding.left + labelWidth - 8}
                      y={baseY}
                      textAnchor="end"
                      className="text-[10px] fill-slate-600 font-medium select-none"
                    >
                      {yRows.map((line, lIdx) => (
                        <tspan
                          key={lIdx}
                          x={padding.left + labelWidth - 8}
                          dy={lIdx === 0 ? 0 : 11}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>

                    {/* Bar */}
                    <rect
                      x={padding.left + labelWidth}
                      y={slotY + (slotHeight - barH) / 2}
                      width={barW}
                      height={barH}
                      rx={3}
                      fill={color}
                      className="transition-all duration-150 hover:brightness-110"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHovered({
                          xLabel: item.label,
                          series: seriesKeys[0] || 'Value',
                          value: val,
                          posX: rect.x + rect.width,
                          posY: rect.y + rect.height / 2,
                        });
                      }}
                      onMouseLeave={() => setHovered(null)}
                    />

                    {/* Direct Value Label */}
                    {config.showValues && (
                      <text
                        x={padding.left + labelWidth + barW + 6}
                        y={slotY + slotHeight / 2 + 3}
                        className="text-[10px] fill-slate-500 font-mono tabular-nums"
                      >
                        {formatValue(val, config.numberFormat)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        {hovered && (
          <div
            className="fixed pointer-events-none z-50 bg-slate-900 text-white rounded-lg shadow-xl px-3 py-1.5 text-xs -translate-x-1/2 -translate-y-full mb-2"
            style={{ left: hovered.posX, top: hovered.posY - 6 }}
          >
            <div className="font-semibold text-slate-100">{hovered.xLabel}</div>
            <div className="flex items-center gap-2 text-slate-300 mt-0.5">
              <span>{hovered.series}:</span>
              <span className="font-mono tabular-nums font-medium text-white">
                {formatValue(hovered.value, config.numberFormat)}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Click bar to filter</div>
          </div>
        )}
      </div>
    </div>
  );
};
