import React from 'react';
import { Upload, Plus, LayoutDashboard, Table, FolderOpen, Sparkles, X, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  currentView: 'dashboard' | 'table';
  onViewChange: (view: 'dashboard' | 'table') => void;
  onOpenUpload: () => void;
  onAddChart: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  datasetName?: string | null;
  onClearDataset?: () => void;
  hasDataset: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenUpload,
  onAddChart,
  onToggleChat,
  isChatOpen,
  datasetName,
  onClearDataset,
  hasDataset,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-xs relative z-20">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark & Active Dataset Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            V
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Visual Analyzer
          </span>
          <span className="hidden sm:inline-block text-slate-300">/</span>
          {hasDataset && datasetName ? (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium max-w-xs truncate border border-slate-200">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate" title={datasetName}>{datasetName}</span>
              {onClearDataset && (
                <button
                  onClick={onClearDataset}
                  title="Unload dataset and return to welcome screen"
                  className="ml-1 text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <span className="hidden sm:inline-block text-xs text-slate-400 italic">
              No dataset loaded
            </span>
          )}
        </div>

        {/* Zone 2: Navigation links & View switcher */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => (hasDataset ? onViewChange('dashboard') : onOpenUpload())}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              hasDataset && currentView === 'dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => (hasDataset ? onViewChange('table') : onOpenUpload())}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              hasDataset && currentView === 'table'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Data Grid</span>
          </button>

          {hasDataset && (
            <button
              onClick={onAddChart}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Chart</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>{hasDataset ? 'Datasets' : 'Open Datasets'}</span>
          </button>

          {hasDataset && (
            <button
              onClick={onToggleChat}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isChatOpen
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={isChatOpen ? 'Hide dataset intelligence panel' : 'Open dataset intelligence & queries'}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Intelligence</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
