import React, { useState } from 'react';
import { ChartConfig, ColumnMeta, ChartType, AggregationType, ColorPalette, NumberFormat } from '../types/data';
import { PALETTES } from '../utils/colors';
import { ChartRenderer } from './charts/ChartRenderer';
import {
  X,
  BarChart3,
  LineChart,
  AreaChart,
  PieChart,
  Activity,
  Grid,
  Hash,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface ChartCustomizerProps {
  initialConfig: ChartConfig;
  columns: ColumnMeta[];
  rows: Record<string, any>[];
  numericColumns: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ChartConfig) => void;
}

export const ChartCustomizer: React.FC<ChartCustomizerProps> = ({
  initialConfig,
  columns,
  rows,
  numericColumns,
  isOpen,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState<ChartConfig>({ ...initialConfig });
  const [activeTab, setActiveTab] = useState<'data' | 'style' | 'layout'>('data');

  if (!isOpen) return null;

  const chartTypes: { type: ChartType; label: string; icon: React.ReactNode }[] = [
    { type: 'bar', label: 'Bar', icon: <BarChart3 className="w-4 h-4" /> },
    { type: 'line', label: 'Line', icon: <LineChart className="w-4 h-4" /> },
    { type: 'area', label: 'Area', icon: <AreaChart className="w-4 h-4" /> },
    { type: 'pie', label: 'Pie', icon: <PieChart className="w-4 h-4" /> },
    { type: 'donut', label: 'Donut', icon: <PieChart className="w-4 h-4" /> },
    { type: 'scatter', label: 'Scatter', icon: <Activity className="w-4 h-4" /> },
    { type: 'histogram', label: 'Histogram', icon: <BarChart3 className="w-4 h-4" /> },
    { type: 'heatmap', label: 'Heatmap', icon: <Grid className="w-4 h-4" /> },
    { type: 'kpi', label: 'KPI Card', icon: <Hash className="w-4 h-4" /> },
    { type: 'radar', label: 'Radar', icon: <Sliders className="w-4 h-4" /> },
  ];

  const aggregations: { id: AggregationType; label: string }[] = [
    { id: 'sum', label: 'Sum (Total)' },
    { id: 'mean', label: 'Average (Mean)' },
    { id: 'count', label: 'Count of Rows' },
    { id: 'median', label: 'Median' },
    { id: 'min', label: 'Minimum' },
    { id: 'max', label: 'Maximum' },
  ];

  const palettes: ColorPalette[] = ['indigo', 'emerald', 'blue', 'amber', 'sunset', 'purple', 'slate'];

  const formats: { id: NumberFormat; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'currency', label: 'Currency ($)' },
    { id: 'percent', label: 'Percentage (%)' },
    { id: 'compact', label: 'Compact (1.2M, 50k)' },
    { id: 'decimal', label: 'Decimal (123.45)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Customize Visualization</h2>
            <p className="text-xs text-slate-500">Fine-tune chart dimensions, metrics, styles, and scales</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left configuration pane, Right live preview pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Controls Column */}
          <div className="w-full md:w-1/2 border-r border-slate-200 flex flex-col overflow-hidden">
            {/* Control Tabs */}
            <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 shrink-0">
              <button
                onClick={() => setActiveTab('data')}
                className={`pb-2.5 text-xs font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'data'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Data & Dimensions
              </button>
              <button
                onClick={() => setActiveTab('style')}
                className={`pb-2.5 text-xs font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'style'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Style & Palette
              </button>
              <button
                onClick={() => setActiveTab('layout')}
                className={`pb-2.5 text-xs font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'layout'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Card Layout
              </button>
            </div>

            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeTab === 'data' && (
                <>
                  {/* Chart Type Grid */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Visualization Type</label>
                    <div className="grid grid-cols-5 gap-2">
                      {chartTypes.map((ct) => (
                        <button
                          key={ct.type}
                          type="button"
                          onClick={() => setConfig({ ...config, type: ct.type })}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                            config.type === ct.type
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="mb-1">{ct.icon}</span>
                          <span className="text-[11px] truncate">{ct.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Chart Title</label>
                      <input
                        type="text"
                        value={config.title}
                        onChange={(e) => setConfig({ ...config, title: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600"
                        placeholder="e.g. Revenue by Region"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Subtitle (optional)</label>
                      <input
                        type="text"
                        value={config.subtitle || ''}
                        onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600"
                        placeholder="e.g. Fiscal Q1-Q4"
                      />
                    </div>
                  </div>

                  {/* X Axis Column */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {config.type === 'histogram'
                        ? 'Distribution Variable (X-Axis)'
                        : 'Category / Grouping / X-Axis Column'}
                    </label>
                    <select
                      value={config.xAxis}
                      onChange={(e) => setConfig({ ...config, xAxis: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600 bg-white"
                    >
                      {columns.map((col) => (
                        <option key={col.name} value={col.name}>
                          {col.name} ({col.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Y Axis Column */}
                  {config.type !== 'histogram' && config.type !== 'heatmap' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Metric / Numerical Y-Axis Column
                      </label>
                      <select
                        value={config.yAxis}
                        onChange={(e) => setConfig({ ...config, yAxis: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600 bg-white"
                      >
                        {columns.map((col) => (
                          <option key={col.name} value={col.name}>
                            {col.name} ({col.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Secondary Series / Group By */}
                  {(config.type === 'bar' ||
                    config.type === 'line' ||
                    config.type === 'area' ||
                    config.type === 'scatter') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Breakdown / Multi-Series Dimension (optional)
                      </label>
                      <select
                        value={config.groupBy || ''}
                        onChange={(e) => setConfig({ ...config, groupBy: e.target.value || undefined })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600 bg-white"
                      >
                        <option value="">None (Single Series)</option>
                        {columns.map((col) => (
                          <option key={col.name} value={col.name}>
                            {col.name} ({col.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Size Field for Scatter */}
                  {config.type === 'scatter' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Bubble Size Dimension (optional)
                      </label>
                      <select
                        value={config.sizeField || ''}
                        onChange={(e) => setConfig({ ...config, sizeField: e.target.value || undefined })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600 bg-white"
                      >
                        <option value="">Default Uniform Size</option>
                        {columns
                          .filter((c) => c.type === 'number')
                          .map((col) => (
                            <option key={col.name} value={col.name}>
                              {col.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Aggregation */}
                  {config.type !== 'scatter' && config.type !== 'heatmap' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Aggregation Function
                      </label>
                      <select
                        value={config.aggregation}
                        onChange={(e) =>
                          setConfig({ ...config, aggregation: e.target.value as AggregationType })
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600 bg-white"
                      >
                        {aggregations.map((agg) => (
                          <option key={agg.id} value={agg.id}>
                            {agg.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sort Order & Top N */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Sorting</label>
                      <select
                        value={config.sortOrder || 'none'}
                        onChange={(e) => setConfig({ ...config, sortOrder: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600 bg-white"
                      >
                        <option value="none">Default Order</option>
                        <option value="desc">Highest Value First</option>
                        <option value="asc">Lowest Value First</option>
                        <option value="alphabetical">A to Z Label</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Top Records Limit</label>
                      <select
                        value={config.topN === 'all' || !config.topN ? 'all' : String(config.topN)}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            topN: e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600 bg-white"
                      >
                        <option value="all">All Values</option>
                        <option value="5">Top 5 Items</option>
                        <option value="10">Top 10 Items</option>
                        <option value="15">Top 15 Items</option>
                        <option value="20">Top 20 Items</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'style' && (
                <>
                  {/* Color Palette */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Color Theme</label>
                    <div className="grid grid-cols-2 gap-2">
                      {palettes.map((pal) => {
                        const item = PALETTES[pal];
                        return (
                          <button
                            key={pal}
                            type="button"
                            onClick={() => setConfig({ ...config, colorPalette: pal })}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                              config.colorPalette === pal
                                ? 'border-indigo-600 bg-indigo-50/40 text-slate-900 font-medium'
                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                            }`}
                          >
                            <span>{item.name}</span>
                            <div className="flex items-center gap-1">
                              {item.colors.slice(0, 4).map((c, i) => (
                                <span
                                  key={i}
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Number Format */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Number Formatting</label>
                    <select
                      value={config.numberFormat || 'auto'}
                      onChange={(e) =>
                        setConfig({ ...config, numberFormat: e.target.value as NumberFormat })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600 bg-white"
                    >
                      {formats.map((fmt) => (
                        <option key={fmt.id} value={fmt.id}>
                          {fmt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bar Chart Specific Options */}
                  {config.type === 'bar' && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!config.isHorizontal}
                          onChange={(e) => setConfig({ ...config, isHorizontal: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Horizontal Bar Chart</span>
                      </label>

                      {config.groupBy && (
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!config.isStacked}
                            onChange={(e) => setConfig({ ...config, isStacked: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Stacked Bars (instead of Grouped)</span>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Line / Area Curve Options */}
                  {(config.type === 'line' || config.type === 'area') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Line Curve Style</label>
                      <select
                        value={config.curve || 'smooth'}
                        onChange={(e) => setConfig({ ...config, curve: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600 bg-white"
                      >
                        <option value="smooth">Smooth Cubic Spline</option>
                        <option value="linear">Straight Linear Segments</option>
                        <option value="step">Stepped Staircase</option>
                      </select>
                    </div>
                  )}

                  {/* General Visual Toggles */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showGrid !== false}
                        onChange={(e) => setConfig({ ...config, showGrid: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Show Grid Guidelines</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showLegend !== false}
                        onChange={(e) => setConfig({ ...config, showLegend: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Show Legend & Series Tags</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!config.showValues}
                        onChange={(e) => setConfig({ ...config, showValues: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Show Data Value Callouts</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'layout' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      Card Width in Dashboard Grid
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: '1/3', label: 'One Third (1/3 Width)' },
                        { id: '1/2', label: 'Half Width (1/2 Width)' },
                        { id: '2/3', label: 'Two Thirds (2/3 Width)' },
                        { id: 'full', label: 'Full Span (100% Width)' },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setConfig({ ...config, width: w.id as any })}
                          className={`p-3 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                            config.width === w.id
                              ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 font-semibold'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Real-time Preview Pane */}
          <div className="w-full md:w-1/2 bg-slate-50 p-6 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Live Preview
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {rows.length} rows loaded
                </span>
              </div>

              {/* Rendered Card Box */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs h-[360px] flex flex-col">
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{config.title}</h3>
                  {config.subtitle && (
                    <p className="text-xs text-slate-500 truncate">{config.subtitle}</p>
                  )}
                </div>
                <div className="flex-1 relative min-h-0">
                  <ChartRenderer
                    config={config}
                    rows={rows}
                    numericColumns={numericColumns}
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave(config)}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
              >
                Save Visualization
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
