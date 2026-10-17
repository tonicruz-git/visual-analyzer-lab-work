import React from 'react';
import { ChartConfig, ColumnMeta, ChartType } from '../types/data';
import {
  BarChart3,
  LineChart,
  AreaChart,
  PieChart,
  Activity,
  Grid,
  Hash,
  Sliders,
  X,
  Plus,
} from 'lucide-react';

interface AddChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnMeta[];
  onAdd: (config: ChartConfig) => void;
}

export const AddChartModal: React.FC<AddChartModalProps> = ({
  isOpen,
  onClose,
  columns,
  onAdd,
}) => {
  if (!isOpen) return null;

  const numCols = columns.filter((c) => c.type === 'number');
  const catCols = columns.filter((c) => c.type === 'string' || c.type === 'boolean');
  const dateCols = columns.filter((c) => c.type === 'date');

  const defaultX = (catCols[0] || dateCols[0] || columns[0])?.name || '';
  const defaultY = (numCols[0] || columns[1] || columns[0])?.name || '';

  const templates: {
    type: ChartType;
    title: string;
    description: string;
    icon: React.ReactNode;
    defaultProps: Partial<ChartConfig>;
  }[] = [
    {
      type: 'bar',
      title: 'Categorical Bar Chart',
      description: 'Compare values across categories, regions, or product groups.',
      icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
      defaultProps: {
        xAxis: defaultX,
        yAxis: defaultY,
        aggregation: 'sum',
        colorPalette: 'indigo',
        showGrid: true,
        showLegend: true,
        width: '1/2',
      },
    },
    {
      type: 'line',
      title: 'Time Series / Continuous Line',
      description: 'Track chronological progress, trajectories, and momentum.',
      icon: <LineChart className="w-5 h-5 text-blue-600" />,
      defaultProps: {
        xAxis: (dateCols[0] || columns[0])?.name || defaultX,
        yAxis: defaultY,
        aggregation: 'sum',
        colorPalette: 'blue',
        curve: 'smooth',
        showGrid: true,
        showLegend: true,
        width: '1/2',
      },
    },
    {
      type: 'area',
      title: 'Stacked Area Chart',
      description: 'Show cumulative volume and volume progression over dimensions.',
      icon: <AreaChart className="w-5 h-5 text-emerald-600" />,
      defaultProps: {
        xAxis: defaultX,
        yAxis: defaultY,
        aggregation: 'sum',
        colorPalette: 'emerald',
        curve: 'smooth',
        showGrid: true,
        width: '1/2',
      },
    },
    {
      type: 'donut',
      title: 'Donut & Pie Distribution',
      description: 'Display percentage share and composition of a whole.',
      icon: <PieChart className="w-5 h-5 text-rose-600" />,
      defaultProps: {
        xAxis: defaultX,
        yAxis: defaultY,
        aggregation: 'sum',
        colorPalette: 'sunset',
        showLegend: true,
        showValues: true,
        width: '1/3',
      },
    },
    {
      type: 'scatter',
      title: 'Scatter & Bubble Plot',
      description: 'Analyze correlation between two or three numeric variables.',
      icon: <Activity className="w-5 h-5 text-purple-600" />,
      defaultProps: {
        xAxis: numCols[0]?.name || defaultX,
        yAxis: (numCols[1] || numCols[0])?.name || defaultY,
        groupBy: catCols[0]?.name,
        aggregation: 'mean',
        colorPalette: 'purple',
        showGrid: true,
        showLegend: true,
        width: '1/2',
      },
    },
    {
      type: 'histogram',
      title: 'Frequency Distribution',
      description: 'Discover bin frequencies and statistical spread.',
      icon: <BarChart3 className="w-5 h-5 text-amber-600" />,
      defaultProps: {
        xAxis: numCols[0]?.name || defaultY,
        yAxis: defaultY,
        aggregation: 'count',
        colorPalette: 'amber',
        showGrid: true,
        width: '1/3',
      },
    },
    {
      type: 'heatmap',
      title: 'Correlation Matrix Heatmap',
      description: 'Cross-variable Pearson correlation grid for all numeric data.',
      icon: <Grid className="w-5 h-5 text-indigo-600" />,
      defaultProps: {
        xAxis: defaultX,
        yAxis: defaultY,
        aggregation: 'mean',
        colorPalette: 'indigo',
        width: '1/2',
      },
    },
    {
      type: 'kpi',
      title: 'KPI Metric & Sparkline Card',
      description: 'Prominent summary stat with sparkline trend indicator.',
      icon: <Hash className="w-5 h-5 text-slate-700" />,
      defaultProps: {
        xAxis: defaultX,
        yAxis: defaultY,
        aggregation: 'sum',
        colorPalette: 'indigo',
        width: '1/3',
      },
    },
    {
      type: 'radar',
      title: 'Radar / Spider Chart',
      description: 'Compare multiple performance attributes across categories.',
      icon: <Sliders className="w-5 h-5 text-teal-600" />,
      defaultProps: {
        xAxis: defaultX,
        yAxis: defaultY,
        aggregation: 'mean',
        colorPalette: 'emerald',
        width: '1/3',
      },
    },
  ];

  const handleSelectTemplate = (t: (typeof templates)[0]) => {
    const newConfig: ChartConfig = {
      id: 'chart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: `${t.title.split(' ')[0]} of ${t.defaultProps.yAxis || 'Data'} by ${t.defaultProps.xAxis || 'Category'}`,
      subtitle: `Aggregated by ${t.defaultProps.aggregation || 'sum'}`,
      type: t.type,
      xAxis: t.defaultProps.xAxis || defaultX,
      yAxis: t.defaultProps.yAxis || defaultY,
      aggregation: t.defaultProps.aggregation || 'sum',
      colorPalette: t.defaultProps.colorPalette || 'indigo',
      width: t.defaultProps.width || '1/2',
      showGrid: true,
      showLegend: true,
      ...t.defaultProps,
    };
    onAdd(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add New Chart</h2>
            <p className="text-xs text-slate-500">Choose a chart type to instantly visualize your data</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto">
          {templates.map((t) => (
            <div
              key={t.type}
              onClick={() => handleSelectTemplate(t)}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-indigo-100/60 transition-colors">
                    {t.icon}
                  </div>
                  <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-4 h-4" />
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {t.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
