/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Dataset, ChartConfig, FilterState } from './types/data';
import { initializeFilterState, applyFilters } from './utils/filterEngine';
import { Header } from './components/Header';
import { WelcomeView } from './components/WelcomeView';
import { FilterBar } from './components/FilterBar';
import { MetricSummaryStrip } from './components/MetricSummaryStrip';
import { ChartContainer } from './components/charts/ChartContainer';
import { ChartRenderer } from './components/charts/ChartRenderer';
import { ChartCustomizer } from './components/ChartCustomizer';
import { CsvUploadModal } from './components/CsvUploadModal';
import { AddChartModal } from './components/AddChartModal';
import { DataTable } from './components/DataTable';
import { AnalyzerChat } from './components/AnalyzerChat';
import { Plus, Upload, Sparkles, LayoutGrid } from 'lucide-react';

export default function App() {
  // Fresh initial state: start without pre-populated hard-coded data
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [filterState, setFilterState] = useState<FilterState | null>(null);

  const [currentView, setCurrentView] = useState<'dashboard' | 'table'>('dashboard');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddChartModalOpen, setIsAddChartModalOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [intelligenceLayout, setIntelligenceLayout] = useState<'sidebar' | 'inline'>('sidebar');

  // When a dataset is uploaded or selected
  const handleDatasetLoaded = (newDataset: Dataset, recommendedCharts?: ChartConfig[]) => {
    setDataset(newDataset);
    setFilterState(initializeFilterState(newDataset));
    setCurrentView('dashboard');

    if (recommendedCharts && recommendedCharts.length > 0) {
      setCharts(recommendedCharts);
    } else {
      // Auto-generate sensible default charts tailored specifically to this CSV's schema
      const numCols = newDataset.columns.filter((c) => c.type === 'number');
      const catCols = newDataset.columns.filter((c) => c.type === 'string' || c.type === 'boolean');
      const dateCols = newDataset.columns.filter((c) => c.type === 'date');

      const primaryCat = (catCols[0] || dateCols[0] || newDataset.columns[0])?.name || '';
      const primaryNum = (numCols[0] || newDataset.columns[1] || newDataset.columns[0])?.name || '';
      const secondaryNum = (numCols[1] || numCols[0])?.name || primaryNum;

      const autoCharts: ChartConfig[] = [
        {
          id: 'auto_bar_' + Date.now(),
          title: `${primaryNum} by ${primaryCat}`,
          subtitle: 'Categorical aggregated distribution',
          type: 'bar',
          xAxis: primaryCat,
          yAxis: primaryNum,
          aggregation: 'sum',
          colorPalette: 'indigo',
          showGrid: true,
          showLegend: true,
          sortOrder: 'desc',
          width: '1/2',
        },
      ];

      if (dateCols.length > 0) {
        autoCharts.push({
          id: 'auto_line_' + Date.now(),
          title: `${primaryNum} Trend over Time`,
          subtitle: `Chronological progression along ${dateCols[0].name}`,
          type: 'line',
          xAxis: dateCols[0].name,
          yAxis: primaryNum,
          aggregation: 'sum',
          colorPalette: 'blue',
          curve: 'smooth',
          showGrid: true,
          width: '1/2',
        });
      } else if (numCols.length >= 2) {
        autoCharts.push({
          id: 'auto_scatter_' + Date.now(),
          title: `${primaryNum} vs ${secondaryNum}`,
          subtitle: 'Correlation scatter analysis',
          type: 'scatter',
          xAxis: primaryNum,
          yAxis: secondaryNum,
          groupBy: catCols[0]?.name,
          aggregation: 'mean',
          colorPalette: 'emerald',
          showGrid: true,
          showLegend: true,
          width: '1/2',
        });
      }

      if (catCols.length > 0 && numCols.length > 0) {
        autoCharts.push({
          id: 'auto_donut_' + Date.now(),
          title: `Share of ${primaryNum} by ${catCols[0].name}`,
          subtitle: 'Proportional distribution',
          type: 'donut',
          xAxis: catCols[0].name,
          yAxis: primaryNum,
          aggregation: 'sum',
          colorPalette: 'sunset',
          showLegend: true,
          showValues: true,
          width: '1/3',
        });
      }

      if (numCols.length > 0) {
        autoCharts.push({
          id: 'auto_hist_' + Date.now(),
          title: `${primaryNum} Distribution Frequency`,
          subtitle: 'Value histogram across bins',
          type: 'histogram',
          xAxis: primaryNum,
          yAxis: primaryNum,
          aggregation: 'count',
          colorPalette: 'amber',
          showGrid: true,
          width: '1/3',
        });
      }

      if (numCols.length >= 2) {
        autoCharts.push({
          id: 'auto_heatmap_' + Date.now(),
          title: 'Numeric Correlation Matrix',
          subtitle: 'Pearson correlation coefficients',
          type: 'heatmap',
          xAxis: primaryCat,
          yAxis: primaryNum,
          aggregation: 'mean',
          colorPalette: 'indigo',
          width: '1/3',
        });
      }

      setCharts(autoCharts);
    }
  };

  const handleClearDataset = () => {
    setDataset(null);
    setCharts([]);
    setFilterState(null);
    setIsChatOpen(false);
    setCurrentView('dashboard');
  };

  // Real-time filtered rows
  const filteredRows = useMemo(() => {
    if (!dataset || !filterState) return [];
    return applyFilters(dataset.rows, filterState);
  }, [dataset, filterState]);

  // Numeric column names
  const numericColumns = useMemo(() => {
    if (!dataset) return [];
    return dataset.columns.filter((c) => c.type === 'number').map((c) => c.name);
  }, [dataset]);

  // Cross-filtering trigger from chart interactions
  const handleCrossFilterSelect = (colName: string, val: string) => {
    if (!filterState) return;
    const current = filterState.categoricalSelections[colName] || [];
    const updated = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];

    setFilterState({
      ...filterState,
      categoricalSelections: {
        ...filterState.categoricalSelections,
        [colName]: updated,
      },
    });
  };

  const handleCrossFilterRange = (colName: string, min: number, max: number) => {
    if (!filterState) return;
    const base = filterState.numericRanges[colName];
    if (!base) return;
    setFilterState({
      ...filterState,
      numericRanges: {
        ...filterState.numericRanges,
        [colName]: {
          ...base,
          currentMin: min,
          currentMax: max,
        },
      },
    });
  };

  // Chart Actions
  const handleSaveChart = (updatedConfig: ChartConfig) => {
    setCharts((prev) =>
      prev.map((c) => (c.id === updatedConfig.id ? updatedConfig : c))
    );
    setEditingChart(null);
  };

  const handleAddChart = (newConfig: ChartConfig) => {
    setCharts((prev) => [...prev, newConfig]);
  };

  const handleDeleteChart = (id: string) => {
    setCharts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDuplicateChart = (config: ChartConfig) => {
    const duplicated: ChartConfig = {
      ...config,
      id: 'chart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: `${config.title} (Copy)`,
    };
    setCharts((prev) => [...prev, duplicated]);
  };

  const handleUpdateChartAggregation = (chartId: string, agg: any) => {
    setCharts((prev) =>
      prev.map((c) => (c.id === chartId ? { ...c, aggregation: agg } : c))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onAddChart={() => setIsAddChartModalOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        datasetName={dataset?.name}
        onClearDataset={handleClearDataset}
        hasDataset={!!dataset}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!dataset || !filterState ? (
          /* First-time welcome view explaining features & where to start */
          <WelcomeView
            onDatasetLoaded={handleDatasetLoaded}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
        ) : (
          /* Active Dataset Dashboard or Table View */
          <div className="space-y-6">
            {/* Metric Summary Strip */}
            <MetricSummaryStrip
              totalRows={dataset.rowCount}
              filteredRows={filteredRows}
              columns={dataset.columns}
            />

            {/* Global Real-Time Filter Bar */}
            <FilterBar
              filterState={filterState}
              columns={dataset.columns}
              totalRows={dataset.rowCount}
              filteredRowsCount={filteredRows.length}
              onFilterChange={setFilterState}
              onResetFilters={() => setFilterState(initializeFilterState(dataset))}
            />

            {/* Main Content Area: Dashboard with integrated Intelligence & Visualizations or Data Grid */}
            {currentView === 'dashboard' ? (
              <div className="space-y-6">
                {/* Mode 1: Inline Full-Width Intelligence Section (when inline layout is selected) */}
                {isChatOpen && intelligenceLayout === 'inline' && (
                  <AnalyzerChat
                    key={`inline_${dataset.id}`}
                    dataset={dataset}
                    filteredRows={filteredRows}
                    filterState={filterState}
                    charts={charts}
                    onAddSuggestedChart={handleAddChart}
                    isOpen={true}
                    layoutMode="inline"
                    onToggleLayoutMode={() => setIntelligenceLayout('sidebar')}
                    onClose={() => setIsChatOpen(false)}
                  />
                )}

                {/* Dashboard Grid Container: Either split with Sidebar Workbench or full-width */}
                <div
                  className={`flex flex-col ${
                    isChatOpen && intelligenceLayout === 'sidebar'
                      ? 'xl:flex-row items-start gap-6'
                      : ''
                  }`}
                >
                  {/* Visualizations Grid */}
                  <div className="flex-1 min-w-0 w-full">
                    {charts.length === 0 ? (
                      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                          <LayoutGrid className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">
                          No charts on this dashboard yet
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mb-4">
                          Add custom visualizations or use the Intelligence panel to generate charts tailored to your data.
                        </p>
                        <button
                          onClick={() => setIsAddChartModalOpen(true)}
                          className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add First Chart</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-5">
                        {charts.map((config) => (
                          <ChartContainer
                            key={config.id}
                            config={config}
                            onEdit={() => setEditingChart(config)}
                            onDelete={() => handleDeleteChart(config.id)}
                            onDuplicate={() => handleDuplicateChart(config)}
                          >
                            <ChartRenderer
                              config={config}
                              rows={filteredRows}
                              numericColumns={numericColumns}
                              onFilterSelect={handleCrossFilterSelect}
                              onFilterRange={handleCrossFilterRange}
                              onUpdateAggregation={(agg) =>
                                handleUpdateChartAggregation(config.id, agg)
                              }
                            />
                          </ChartContainer>
                        ))}
                      </div>
                    )}

                    {/* Bottom Add Chart & Switcher Bar */}
                    <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{charts.length} visualizations active</span>
                        <span>·</span>
                        <span>Click any chart bar or slice to cross-filter</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsAddChartModalOpen(true)}
                          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Visualization</span>
                        </button>
                        <button
                          onClick={() => setIsUploadModalOpen(true)}
                          className="px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Load Another CSV</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mode 2: Integrated Sidebar Workbench on the right */}
                  {isChatOpen && intelligenceLayout === 'sidebar' ? (
                    <aside className="w-full xl:w-[420px] 2xl:w-[460px] shrink-0 xl:sticky xl:top-6 transition-all">
                      <AnalyzerChat
                        key={`sidebar_${dataset.id}`}
                        dataset={dataset}
                        filteredRows={filteredRows}
                        filterState={filterState}
                        charts={charts}
                        onAddSuggestedChart={handleAddChart}
                        isOpen={true}
                        layoutMode="sidebar"
                        onToggleLayoutMode={() => setIntelligenceLayout('inline')}
                        onClose={() => setIsChatOpen(false)}
                      />
                    </aside>
                  ) : (
                    /* Collapsed Right-Side Strip to reopen */
                    !isChatOpen && (
                      <aside className="hidden xl:flex flex-col items-center xl:sticky xl:top-6 shrink-0">
                        <button
                          onClick={() => setIsChatOpen(true)}
                          className="flex flex-col items-center gap-2.5 px-3 py-4 bg-white hover:bg-indigo-50/50 border border-slate-200/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-slate-700 hover:text-indigo-600 transition-all cursor-pointer group"
                          title="Open Dataset Intelligence & Query"
                        >
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                          </div>
                          <span className="text-[11px] font-semibold [writing-mode:vertical-lr] tracking-wide text-slate-600 group-hover:text-indigo-600">
                            Dataset Intelligence
                          </span>
                        </button>
                      </aside>
                    )
                  )}
                </div>
              </div>
            ) : (
              /* Raw Data Table View */
              <DataTable
                columns={dataset.columns}
                rows={filteredRows}
                datasetName={dataset.name}
              />
            )}
          </div>
        )}
      </main>

      {/* Chart Customizer Modal */}
      {editingChart && dataset && (
        <ChartCustomizer
          initialConfig={editingChart}
          columns={dataset.columns}
          rows={filteredRows}
          numericColumns={numericColumns}
          isOpen={true}
          onClose={() => setEditingChart(null)}
          onSave={handleSaveChart}
        />
      )}

      {/* CSV Upload & Dataset Picker Modal */}
      <CsvUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDatasetLoaded={handleDatasetLoaded}
      />

      {/* Add New Chart Modal */}
      {dataset && (
        <AddChartModal
          isOpen={isAddChartModalOpen}
          onClose={() => setIsAddChartModalOpen(false)}
          columns={dataset.columns}
          onAdd={handleAddChart}
        />
      )}
    </div>
  );
}
