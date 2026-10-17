/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Dataset, ChartConfig, FilterState } from './types/data';
import { loadDefaultDataset } from './data/sampleDatasets';
import { initializeFilterState, applyFilters } from './utils/filterEngine';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { MetricSummaryStrip } from './components/MetricSummaryStrip';
import { ChartContainer } from './components/charts/ChartContainer';
import { ChartRenderer } from './components/charts/ChartRenderer';
import { ChartCustomizer } from './components/ChartCustomizer';
import { CsvUploadModal } from './components/CsvUploadModal';
import { AddChartModal } from './components/AddChartModal';
import { DataTable } from './components/DataTable';
import { Plus, Upload, Sparkles, LayoutGrid } from 'lucide-react';

export default function App() {
  // Initialize with curated default dataset (SaaS Sales & Performance)
  const [initialData] = useState(() => loadDefaultDataset());
  const [dataset, setDataset] = useState<Dataset>(initialData.dataset);
  const [charts, setCharts] = useState<ChartConfig[]>(initialData.charts);
  const [filterState, setFilterState] = useState<FilterState>(() =>
    initializeFilterState(initialData.dataset)
  );

  const [currentView, setCurrentView] = useState<'dashboard' | 'table'>('dashboard');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddChartModalOpen, setIsAddChartModalOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);

  // When dataset changes, update filter state
  const handleDatasetLoaded = (newDataset: Dataset, recommendedCharts?: ChartConfig[]) => {
    setDataset(newDataset);
    setFilterState(initializeFilterState(newDataset));

    if (recommendedCharts && recommendedCharts.length > 0) {
      setCharts(recommendedCharts);
    } else {
      // Auto-generate sensible default charts for custom CSV
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

  // Real-time filtered rows
  const filteredRows = useMemo(() => {
    return applyFilters(dataset.rows, filterState);
  }, [dataset.rows, filterState]);

  // Numeric column names
  const numericColumns = useMemo(() => {
    return dataset.columns.filter((c) => c.type === 'number').map((c) => c.name);
  }, [dataset.columns]);

  // Cross-filtering trigger from chart interactions
  const handleCrossFilterSelect = (colName: string, val: string) => {
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
        datasetName={dataset.name}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {/* Dashboard Grid View */}
        {currentView === 'dashboard' ? (
          <div>
            {charts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  No charts on this dashboard yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Add custom visualizations to start exploring patterns and trends in your data.
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
                  <span>Load New CSV</span>
                </button>
              </div>
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
      </main>

      {/* Chart Customizer Modal */}
      {editingChart && (
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
      <AddChartModal
        isOpen={isAddChartModalOpen}
        onClose={() => setIsAddChartModalOpen(false)}
        columns={dataset.columns}
        onAdd={handleAddChart}
      />
    </div>
  );
}
