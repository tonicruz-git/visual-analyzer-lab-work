import { ChartConfig, AggregationType } from '../types/data';

export interface SeriesDataPoint {
  label: string;
  values: Record<string, number>; // seriesName -> aggregated value
  rawTotal: number;
}

export interface PieSlice {
  label: string;
  value: number;
  percentage: number;
  colorIndex: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  size: number;
  group: string;
  label: string;
  raw: Record<string, any>;
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  label: string;
  count: number;
}

export interface HeatmapCell {
  xCol: string;
  yCol: string;
  correlation: number;
}

/**
 * Aggregate an array of numbers
 */
export function aggregateValues(nums: number[], method: AggregationType): number {
  if (nums.length === 0) return 0;
  if (method === 'count') return nums.length;

  const valid = nums.filter((n) => !isNaN(n));
  if (valid.length === 0) return 0;

  switch (method) {
    case 'sum':
      return valid.reduce((a, b) => a + b, 0);
    case 'mean':
      return valid.reduce((a, b) => a + b, 0) / valid.length;
    case 'min':
      return Math.min(...valid);
    case 'max':
      return Math.max(...valid);
    case 'median': {
      const sorted = [...valid].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    default:
      return valid.reduce((a, b) => a + b, 0);
  }
}

/**
 * Compute Grouped / Multi-series data for Bar, Line, Area charts
 */
export function computeBarLineData(
  rows: Record<string, any>[],
  config: ChartConfig
): { data: SeriesDataPoint[]; seriesKeys: string[] } {
  if (!rows || rows.length === 0 || !config.xAxis) {
    return { data: [], seriesKeys: [] };
  }

  const { xAxis, yAxis, groupBy, aggregation, sortOrder, topN } = config;
  const groups: Map<string, Map<string, number[]>> = new Map();
  const allSeriesKeys = new Set<string>();

  rows.forEach((row) => {
    const rawX = row[xAxis];
    const xKey = rawX !== null && rawX !== undefined ? String(rawX) : '(Empty)';
    const rawGroup = groupBy ? row[groupBy] : 'Value';
    const seriesKey = rawGroup !== null && rawGroup !== undefined ? String(rawGroup) : 'Value';

    allSeriesKeys.add(seriesKey);

    if (!groups.has(xKey)) {
      groups.set(xKey, new Map());
    }

    const seriesMap = groups.get(xKey)!;
    if (!seriesMap.has(seriesKey)) {
      seriesMap.set(seriesKey, []);
    }

    const yVal = row[yAxis];
    const num = typeof yVal === 'number' ? yVal : parseFloat(String(yVal));
    seriesMap.get(seriesKey)!.push(isNaN(num) ? (aggregation === 'count' ? 1 : 0) : num);
  });

  const seriesKeys = Array.from(allSeriesKeys).slice(0, 10); // cap to 10 series max for readability

  let result: SeriesDataPoint[] = [];

  groups.forEach((seriesMap, xLabel) => {
    const pointValues: Record<string, number> = {};
    let total = 0;

    seriesKeys.forEach((k) => {
      const nums = seriesMap.get(k) || [];
      const agg = aggregateValues(nums, aggregation);
      pointValues[k] = agg;
      total += agg;
    });

    result.push({
      label: xLabel,
      values: pointValues,
      rawTotal: total,
    });
  });

  // Sort
  if (sortOrder === 'desc') {
    result.sort((a, b) => b.rawTotal - a.rawTotal);
  } else if (sortOrder === 'asc') {
    result.sort((a, b) => a.rawTotal - b.rawTotal);
  } else if (sortOrder === 'alphabetical') {
    result.sort((a, b) => a.label.localeCompare(b.label));
  }

  // Top N
  if (typeof topN === 'number' && topN > 0 && result.length > topN) {
    const topItems = result.slice(0, topN);
    const rest = result.slice(topN);

    // Roll rest into "Other"
    const otherValues: Record<string, number> = {};
    let otherTotal = 0;
    seriesKeys.forEach((k) => {
      const sumOther = rest.reduce((sum, item) => sum + (item.values[k] || 0), 0);
      otherValues[k] = aggregation === 'mean' ? sumOther / rest.length : sumOther;
      otherTotal += otherValues[k];
    });

    topItems.push({
      label: 'Other',
      values: otherValues,
      rawTotal: otherTotal,
    });

    result = topItems;
  }

  return { data: result, seriesKeys };
}

/**
 * Compute Pie / Donut chart distribution
 */
export function computePieData(rows: Record<string, any>[], config: ChartConfig): PieSlice[] {
  if (!rows || rows.length === 0 || !config.xAxis) return [];

  const { xAxis, yAxis, aggregation } = config;
  const groups: Map<string, number[]> = new Map();

  rows.forEach((row) => {
    const rawX = row[xAxis];
    const xKey = rawX !== null && rawX !== undefined ? String(rawX) : '(Empty)';
    if (!groups.has(xKey)) groups.set(xKey, []);

    const yVal = row[yAxis];
    const num = typeof yVal === 'number' ? yVal : parseFloat(String(yVal));
    groups.get(xKey)!.push(isNaN(num) ? 1 : num);
  });

  const slices: { label: string; value: number }[] = [];
  let totalSum = 0;

  groups.forEach((nums, label) => {
    const val = Math.max(0, aggregateValues(nums, aggregation));
    slices.push({ label, value: val });
    totalSum += val;
  });

  // Sort descending
  slices.sort((a, b) => b.value - a.value);

  // Group smaller slices into "Other" if more than 7
  let finalSlices: { label: string; value: number }[] = [];
  if (slices.length > 7) {
    finalSlices = slices.slice(0, 6);
    const otherSum = slices.slice(6).reduce((acc, curr) => acc + curr.value, 0);
    if (otherSum > 0) {
      finalSlices.push({ label: 'Other', value: otherSum });
    }
  } else {
    finalSlices = slices;
  }

  return finalSlices.map((item, idx) => ({
    label: item.label,
    value: item.value,
    percentage: totalSum > 0 ? (item.value / totalSum) * 100 : 0,
    colorIndex: idx,
  }));
}

/**
 * Compute Scatter & Bubble chart data
 */
export function computeScatterData(rows: Record<string, any>[], config: ChartConfig): ScatterPoint[] {
  if (!rows || rows.length === 0 || !config.xAxis || !config.yAxis) return [];

  const { xAxis, yAxis, groupBy, sizeField } = config;
  const points: ScatterPoint[] = [];

  rows.forEach((row) => {
    const xVal = Number(row[xAxis]);
    const yVal = Number(row[yAxis]);

    if (!isNaN(xVal) && !isNaN(yVal)) {
      const groupVal = groupBy && row[groupBy] !== undefined ? String(row[groupBy]) : 'Default';
      const sizeVal = sizeField && !isNaN(Number(row[sizeField])) ? Math.max(1, Number(row[sizeField])) : 8;

      points.push({
        x: xVal,
        y: yVal,
        size: sizeVal,
        group: groupVal,
        label: `${xAxis}: ${xVal}, ${yAxis}: ${yVal}`,
        raw: row,
      });
    }
  });

  return points.slice(0, 300); // Guard for rendering performance
}

/**
 * Compute Histogram Bins
 */
export function computeHistogramData(rows: Record<string, any>[], config: ChartConfig, binCount = 8): HistogramBin[] {
  if (!rows || rows.length === 0 || !config.xAxis) return [];

  const values: number[] = rows
    .map((r) => Number(r[config.xAxis]))
    .filter((v) => !isNaN(v) && v !== null);

  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ binStart: min, binEnd: max, label: `${min}`, count: values.length }];
  }

  const range = max - min;
  const step = range / binCount;
  const bins: HistogramBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const start = min + i * step;
    const end = i === binCount - 1 ? max : min + (i + 1) * step;
    bins.push({
      binStart: start,
      binEnd: end,
      label: `${start.toFixed(1)}–${end.toFixed(1)}`,
      count: 0,
    });
  }

  values.forEach((v) => {
    for (let i = 0; i < bins.length; i++) {
      if (v >= bins[i].binStart && (i === bins.length - 1 ? v <= bins[i].binEnd : v < bins[i].binEnd)) {
        bins[i].count++;
        break;
      }
    }
  });

  return bins;
}

/**
 * Compute Pearson Correlation Matrix for numeric columns
 */
export function computeCorrelationMatrix(rows: Record<string, any>[], numericCols: string[]): { cols: string[]; matrix: number[][] } {
  const cols = numericCols.slice(0, 8); // top 8 numeric cols
  const matrix: number[][] = [];

  const colValues: Record<string, number[]> = {};
  cols.forEach((col) => {
    colValues[col] = rows.map((r) => Number(r[col])).filter((v) => !isNaN(v));
  });

  for (let i = 0; i < cols.length; i++) {
    matrix[i] = [];
    const colA = cols[i];
    for (let j = 0; j < cols.length; j++) {
      const colB = cols[j];
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        // Calculate Pearson correlation
        const pairs: [number, number][] = [];
        rows.forEach((r) => {
          const a = Number(r[colA]);
          const b = Number(r[colB]);
          if (!isNaN(a) && !isNaN(b)) {
            pairs.push([a, b]);
          }
        });

        if (pairs.length < 2) {
          matrix[i][j] = 0;
          continue;
        }

        const meanA = pairs.reduce((sum, p) => sum + p[0], 0) / pairs.length;
        const meanB = pairs.reduce((sum, p) => sum + p[1], 0) / pairs.length;

        let num = 0;
        let denA = 0;
        let denB = 0;

        pairs.forEach(([a, b]) => {
          const da = a - meanA;
          const db = b - meanB;
          num += da * db;
          denA += da * da;
          denB += db * db;
        });

        const den = Math.sqrt(denA * denB);
        matrix[i][j] = den === 0 ? 0 : parseFloat((num / den).toFixed(2));
      }
    }
  }

  return { cols, matrix };
}
