import React, { useState, useRef } from 'react';
import { Dataset, ChartConfig } from '../types/data';
import { parseCSV } from '../utils/csvParser';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import {
  Upload,
  FileSpreadsheet,
  BarChart3,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Table,
  Zap,
} from 'lucide-react';

interface WelcomeViewProps {
  onDatasetLoaded: (dataset: Dataset, recommendedCharts?: ChartConfig[]) => void;
  onOpenUploadModal: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onDatasetLoaded,
  onOpenUploadModal,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && !file.name.endsWith('.txt')) {
      setError('Please provide a valid .csv file.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const name = file.name.replace(/\.[^/.]+$/, '');
        const ds = parseCSV(text, name, 'upload');
        onDatasetLoaded(ds);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file. Ensure it contains a valid header row.');
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading file from disk.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sampleId: string) => {
    const s = SAMPLE_DATASETS.find((d) => d.id === sampleId);
    if (!s) return;
    const ds = parseCSV(s.csv, s.name, 'sample');
    const charts: ChartConfig[] = s.recommendedCharts.map((rc, idx) => ({
      ...rc,
      id: 'chart_' + Date.now() + '_' + idx,
    }));
    onDatasetLoaded(ds, charts);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-12">
      {/* Hero Welcome Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Visual Analytics Platform</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Welcome to <span className="text-indigo-600">Visual Analyzer</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Transform any CSV file into an interactive, multi-dimensional dashboard in seconds.
          Explore auto-generated visualizations, filter across dimensions in real-time, and chat with Analyzer for deep-dive statistical insights.
        </p>
      </div>

      {/* Primary Action: Direct Drag-and-Drop Dropzone */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-10 relative overflow-hidden">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isProcessing ? 'Parsing your CSV file...' : 'Drop your CSV file here, or browse files'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Supports standard delimited CSV files with header columns. All parsing happens locally in your browser with zero latency.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Select CSV File</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenUploadModal();
              }}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Paste Raw CSV / More Options</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* How it Works / 3 Quick Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>Where to Start: 3 Quick Steps</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Instant Start</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="text-xs font-bold text-slate-900">Upload Your CSV</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload any dataset. The engine automatically detects data types (numbers, dates, categories, booleans) and computes statistical metrics.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="text-xs font-bold text-slate-900">Customize & Filter</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instant auto-generated charts appear. Customize types (Bar, Line, Scatter, Donut, Heatmaps), adjust color themes, and cross-filter interactively.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="text-xs font-bold text-slate-900">Chat with Analyzer</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Open the AI chat for deep-dive questions, segment comparisons, outlier detection, and 1-click chart generation grounded in your data.
            </p>
          </div>
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900">Core Features & Capabilities</h2>
          <p className="text-xs text-slate-500">Everything you need for full-stack quantitative exploration</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-900">10+ Chart Types</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Bar, Line, Area, Scatter/Bubble, Donut, Histograms, Correlation Matrices, KPI Cards, and Radar spider-plots.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-900">Real-Time Filtering</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Global live text search, dynamic numeric range sliders, categorical multi-select, and direct click-to-filter on chart elements.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Table className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-900">Data Grid Inspector</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Searchable, sortable tabular grid with column profiling (min, max, mean, median, unique counts) and CSV export.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-slate-900">Analyzer AI Chat</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Deep-dive statistical advisor dynamically scoped exclusively to your data with automated chart suggestions.
            </p>
          </div>
        </div>
      </div>

      {/* Or Test with Sample Datasets */}
      <div className="bg-slate-100/70 rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              No CSV ready? Test with curated sample data
            </h3>
            <p className="text-xs text-slate-500">
              Click any sample dataset below to immediately load and test the interactive dashboard.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_DATASETS.slice(0, 3).map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample.id)}
              className="p-4 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all group shadow-2xs cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {sample.name}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-indigo-600 font-medium">
                <FileSpreadsheet className="w-3 h-3" />
                <span>Load Sample Dataset</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
