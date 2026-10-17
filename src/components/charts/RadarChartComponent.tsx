import React, { useMemo } from 'react';
import { ChartConfig } from '../../types/data';
import { computeBarLineData } from '../../utils/chartDataCompute';
import { getPaletteColor } from '../../utils/colors';

interface RadarChartComponentProps {
  rows: Record<string, any>[];
  config: ChartConfig;
}

export const RadarChartComponent: React.FC<RadarChartComponentProps> = ({ rows, config }) => {
  const { data, seriesKeys } = useMemo(() => computeBarLineData(rows, config), [rows, config]);

  const size = 260;
  const center = size / 2;
  const maxRadius = 90;

  // Max value across all items
  const maxVal = useMemo(() => {
    let max = 0;
    data.forEach((d) => {
      seriesKeys.forEach((k) => {
        if (d.values[k] > max) max = d.values[k];
      });
    });
    return max > 0 ? max * 1.1 : 100;
  }, [data, seriesKeys]);

  if (data.length < 3) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
        <span>Radar chart requires at least 3 categories</span>
      </div>
    );
  }

  const angleStep = (2 * Math.PI) / data.length;

  // Calculate polygon points for each series
  const seriesPolygons = seriesKeys.map((seriesKey, sIdx) => {
    const points = data.map((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const val = d.values[seriesKey] || 0;
      const r = (val / maxVal) * maxRadius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return {
      seriesKey,
      color: getPaletteColor(config.colorPalette, sIdx),
      polygon: points.join(' '),
    };
  });

  return (
    <div className="w-full h-full flex flex-col items-center justify-center select-none relative">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-[240px] h-[240px] overflow-visible">
        {/* Web circles */}
        {[0.25, 0.5, 0.75, 1].map((lvl) => (
          <circle
            key={lvl}
            cx={center}
            cy={center}
            r={maxRadius * lvl}
            fill="none"
            stroke="#e2e8f0"
            strokeDasharray="2 2"
          />
        ))}

        {/* Spokes */}
        {data.map((d, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + maxRadius * Math.cos(angle);
          const y = center + maxRadius * Math.sin(angle);
          const labelX = center + (maxRadius + 16) * Math.cos(angle);
          const labelY = center + (maxRadius + 16) * Math.sin(angle);

          return (
            <g key={i}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="#e2e8f0" />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[9px] fill-slate-500 font-medium"
              >
                {d.label.length > 8 ? `${d.label.substring(0, 7)}…` : d.label}
              </text>
            </g>
          );
        })}

        {/* Polygons */}
        {seriesPolygons.map(({ seriesKey, color, polygon }) => (
          <g key={seriesKey}>
            <polygon
              points={polygon}
              fill={color}
              fillOpacity={0.25}
              stroke={color}
              strokeWidth={2}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
