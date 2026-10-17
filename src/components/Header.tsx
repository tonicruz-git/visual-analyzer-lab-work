import React from 'react';
import { Upload, Plus, LayoutDashboard, Table, FolderOpen } from 'lucide-react';

interface HeaderProps {
  currentView: 'dashboard' | 'table';
  onViewChange: (view: 'dashboard' | 'table') => void;
  onOpenUpload: () => void;
  onAddChart: () => void;
  datasetName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenUpload,
  onAddChart,
  datasetName,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-xs relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            V
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Visual Analyzer
          </span>
          <span className="hidden sm:inline-block text-slate-300">/</span>
          <span className="hidden sm:inline-block text-xs text-slate-500 font-medium truncate max-w-xs md:max-w-md" title={datasetName}>
            {datasetName}
          </span>
        </div>

        {/* Zone 2: 4-5 Navigation links & View switcher */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onViewChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onViewChange('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'table'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Data Grid</span>
          </button>

          <button
            onClick={onAddChart}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chart</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Datasets</span>
          </button>
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
