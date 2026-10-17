import React, { useState } from 'react';
import { ChartConfig } from '../../types/data';
import { Maximize2, Minimize2, MoreHorizontal, Pencil, Trash2, Copy, Filter } from 'lucide-react';

interface ChartContainerProps {
  config: ChartConfig;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  children: React.ReactNode;
  activeFilterCount?: number;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  config,
  onEdit,
  onDelete,
  onDuplicate,
  children,
  activeFilterCount = 0,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const widthClass = {
    '1/3': 'lg:col-span-4 col-span-12',
    '1/2': 'lg:col-span-6 col-span-12',
    '2/3': 'lg:col-span-8 col-span-12',
    full: 'col-span-12',
  }[config.width] || 'lg:col-span-6 col-span-12';

  const containerContent = (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all flex flex-col ${
        isFullscreen
          ? 'fixed inset-6 z-50 p-6 overflow-hidden max-h-[calc(100vh-3rem)] shadow-2xl'
          : `p-5 ${widthClass}`
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-2.5 border-b border-slate-100 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight leading-snug break-words" title={config.title}>
              {config.title}
            </h3>
            {activeFilterCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                <Filter className="w-3 h-3" />
                Filtered
              </span>
            )}
          </div>
          {config.subtitle && (
            <p className="text-xs text-slate-500 mt-1 break-words leading-relaxed" title={config.subtitle}>
              {config.subtitle}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            onClick={onEdit}
            title="Customize Chart"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Context Dropdown */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-30 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-xs">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate();
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  Delete Chart
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart Canvas Body */}
      <div className={`relative flex-1 min-h-[260px] ${isFullscreen ? 'h-[calc(100%-4rem)]' : 'h-[280px]'}`}>
        {children}
      </div>
    </div>
  );

  return (
    <>
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsFullscreen(false)}
        />
      )}
      {containerContent}
    </>
  );
};
