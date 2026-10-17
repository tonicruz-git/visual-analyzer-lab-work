import React, { useState } from 'react';
import { FilterState, ColumnMeta } from '../types/data';
import { countActiveFilters } from '../utils/filterEngine';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  ChevronDown,
  Calendar,
  Layers,
} from 'lucide-react';

interface FilterBarProps {
  filterState: FilterState;
  columns: ColumnMeta[];
  totalRows: number;
  filteredRowsCount: number;
  onFilterChange: (newState: FilterState) => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  columns,
  totalRows,
  filteredRowsCount,
  onFilterChange,
  onResetFilters,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const activeCount = countActiveFilters(filterState);
  const percentFiltered = totalRows > 0 ? Math.round((filteredRowsCount / totalRows) * 100) : 100;

  // Categorical columns for fast filtering
  const categoricalCols = columns.filter(
    (c) => (c.type === 'string' || c.type === 'boolean') && c.uniqueCount <= 50 && c.uniqueCount > 1
  );

  // Numeric columns for range filters
  const numericCols = columns.filter((c) => c.type === 'number' && c.min !== undefined && c.max !== undefined);

  // Date columns
  const dateCols = columns.filter((c) => c.type === 'date');

  // Handle category toggle
  const toggleCategoryValue = (colName: string, val: string) => {
    const current = filterState.categoricalSelections[colName] || [];
    const updated = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];

    onFilterChange({
      ...filterState,
      categoricalSelections: {
        ...filterState.categoricalSelections,
        [colName]: updated,
      },
    });
  };

  // Handle numeric range change
  const handleNumericRange = (colName: string, minVal: number, maxVal: number) => {
    const base = filterState.numericRanges[colName];
    if (!base) return;

    onFilterChange({
      ...filterState,
      numericRanges: {
        ...filterState.numericRanges,
        [colName]: {
          ...base,
          currentMin: Math.max(base.min, minVal),
          currentMax: Math.min(base.max, maxVal),
        },
      },
    });
  };

  // Remove specific categorical filter
  const removeCategoryVal = (colName: string, val: string) => {
    toggleCategoryValue(colName, val);
  };

  // Reset numeric range
  const resetNumericRange = (colName: string) => {
    const base = filterState.numericRanges[colName];
    if (!base) return;
    handleNumericRange(colName, base.min, base.max);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 mb-6">
      {/* Top row: Search input + Quick Filter Dropdowns + Filtered Ratio */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterState.search}
            onChange={(e) => onFilterChange({ ...filterState, search: e.target.value })}
            placeholder="Search all records in real time..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600 bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
          />
          {filterState.search && (
            <button
              onClick={() => onFilterChange({ ...filterState, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Trigger Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Categorical Filters */}
          {categoricalCols.slice(0, 4).map((col) => {
            const selected = filterState.categoricalSelections[col.name] || [];
            const isOpen = openDropdown === `cat-${col.name}`;

            return (
              <div key={col.name} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(isOpen ? null : `cat-${col.name}`)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    selected.length > 0
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>{col.name}</span>
                  {selected.length > 0 && (
                    <span className="bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                      {selected.length}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute left-0 top-9 z-30 w-56 max-h-64 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 p-2 text-xs">
                      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                        <span>Filter by {col.name}</span>
                        {selected.length > 0 && (
                          <button
                            onClick={() =>
                              onFilterChange({
                                ...filterState,
                                categoricalSelections: {
                                  ...filterState.categoricalSelections,
                                  [col.name]: [],
                                },
                              })
                            }
                            className="text-indigo-600 hover:underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {col.distinctValues.map((val) => {
                          const isChecked = selected.includes(val);
                          return (
                            <label
                              key={val}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCategoryValue(col.name, val)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate text-slate-700">{val}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Quick Numeric Sliders */}
          {numericCols.slice(0, 3).map((col) => {
            const range = filterState.numericRanges[col.name];
            if (!range) return null;
            const isModified = range.currentMin > range.min || range.currentMax < range.max;
            const isOpen = openDropdown === `num-${col.name}`;

            return (
              <div key={col.name} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(isOpen ? null : `num-${col.name}`)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    isModified
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <span>{col.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute left-0 top-9 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-slate-800">{col.name} Range</span>
                        {isModified && (
                          <button
                            onClick={() => resetNumericRange(col.name)}
                            className="text-indigo-600 hover:underline cursor-pointer text-[11px]"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Min: {range.min}</span>
                          <span>Max: {range.max}</span>
                        </div>

                        {/* Sliders */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400">Lower Bound</label>
                          <input
                            type="range"
                            min={range.min}
                            max={range.max}
                            step={(range.max - range.min) / 50 || 1}
                            value={range.currentMin}
                            onChange={(e) =>
                              handleNumericRange(col.name, parseFloat(e.target.value), range.currentMax)
                            }
                            className="w-full accent-indigo-600"
                          />
                          <div className="text-right text-[11px] font-mono font-medium text-slate-800">
                            {range.currentMin.toLocaleString()}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400">Upper Bound</label>
                          <input
                            type="range"
                            min={range.min}
                            max={range.max}
                            step={(range.max - range.min) / 50 || 1}
                            value={range.currentMax}
                            onChange={(e) =>
                              handleNumericRange(col.name, range.currentMin, parseFloat(e.target.value))
                            }
                            className="w-full accent-indigo-600"
                          />
                          <div className="text-right text-[11px] font-mono font-medium text-slate-800">
                            {range.currentMax.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Date Range if any */}
          {dateCols.length > 0 && (
            <div className="relative">
              {dateCols.slice(0, 1).map((col) => {
                const range = filterState.dateRanges[col.name];
                const isOpen = openDropdown === `date-${col.name}`;
                return (
                  <div key={col.name} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isOpen ? null : `date-${col.name}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{col.name}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {isOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
                        <div className="absolute right-0 top-9 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-xs">
                          <span className="font-semibold text-slate-800 block mb-2">
                            {col.name} Range
                          </span>
                          <div className="space-y-2">
                            <div>
                              <label className="text-[11px] text-slate-500">From</label>
                              <input
                                type="date"
                                value={range?.start ? range.start.split('T')[0] : ''}
                                onChange={(e) =>
                                  onFilterChange({
                                    ...filterState,
                                    dateRanges: {
                                      ...filterState.dateRanges,
                                      [col.name]: {
                                        ...range,
                                        start: e.target.value,
                                      },
                                    },
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border rounded border-slate-300"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-500">To</label>
                              <input
                                type="date"
                                value={range?.end ? range.end.split('T')[0] : ''}
                                onChange={(e) =>
                                  onFilterChange({
                                    ...filterState,
                                    dateRanges: {
                                      ...filterState.dateRanges,
                                      [col.name]: {
                                        ...range,
                                        end: e.target.value,
                                      },
                                    },
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border rounded border-slate-300"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Reset Filters button */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear ({activeCount})</span>
            </button>
          )}
        </div>

        {/* Filtered Records Summary */}
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="font-mono tabular-nums font-semibold text-slate-800">
            {filteredRowsCount.toLocaleString()}
          </span>
          <span>of</span>
          <span className="font-mono tabular-nums">{totalRows.toLocaleString()}</span>
          <span className="text-slate-400">({percentFiltered}%)</span>
        </div>
      </div>

      {/* Bottom row: Active Filter Chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-medium text-slate-400">Active filters:</span>

          {filterState.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs">
              <span>Text: "{filterState.search}"</span>
              <button
                onClick={() => onFilterChange({ ...filterState, search: '' })}
                className="hover:text-slate-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {Object.entries(filterState.categoricalSelections).flatMap(([colName, vals]) =>
            vals.map((v) => (
              <span
                key={`${colName}-${v}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium"
              >
                <span>
                  {colName}: {v}
                </span>
                <button
                  onClick={() => removeCategoryVal(colName, v)}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}

          {Object.entries(filterState.numericRanges).map(([colName, range]) => {
            if (range.currentMin > range.min || range.currentMax < range.max) {
              return (
                <span
                  key={colName}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-medium"
                >
                  <span>
                    {colName}: {range.currentMin.toLocaleString()} – {range.currentMax.toLocaleString()}
                  </span>
                  <button
                    onClick={() => resetNumericRange(colName)}
                    className="hover:text-amber-950 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};
