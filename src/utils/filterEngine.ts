import { Dataset, FilterState } from '../types/data';

/**
 * Initialize a clean filter state from a dataset
 */
export function initializeFilterState(dataset: Dataset): FilterState {
  const numericRanges: FilterState['numericRanges'] = {};
  const categoricalSelections: FilterState['categoricalSelections'] = {};
  const dateRanges: FilterState['dateRanges'] = {};

  dataset.columns.forEach((col) => {
    if (col.type === 'number' && col.min !== undefined && col.max !== undefined) {
      const min = Number(col.min);
      const max = Number(col.max);
      numericRanges[col.name] = {
        min,
        max,
        currentMin: min,
        currentMax: max,
      };
    } else if (col.type === 'string' || col.type === 'boolean') {
      categoricalSelections[col.name] = [];
    } else if (col.type === 'date' && col.min && col.max) {
      dateRanges[col.name] = {
        start: String(col.min),
        end: String(col.max),
      };
    }
  });

  return {
    search: '',
    numericRanges,
    categoricalSelections,
    dateRanges,
  };
}

/**
 * Apply filters to dataset rows in real time
 */
export function applyFilters(rows: Record<string, any>[], filterState: FilterState): Record<string, any>[] {
  const searchTerm = filterState.search.trim().toLowerCase();

  return rows.filter((row) => {
    // 1. Text Search across all fields
    if (searchTerm) {
      const matchesSearch = Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(searchTerm);
      });
      if (!matchesSearch) return false;
    }

    // 2. Numeric range filters
    for (const [colName, range] of Object.entries(filterState.numericRanges)) {
      if (range.currentMin > range.min || range.currentMax < range.max) {
        const rowVal = row[colName];
        if (rowVal === null || rowVal === undefined) return false;
        const numVal = Number(rowVal);
        if (isNaN(numVal)) return false;
        if (numVal < range.currentMin || numVal > range.currentMax) return false;
      }
    }

    // 3. Categorical selections (if non-empty, row value must be in selected list)
    for (const [colName, selectedValues] of Object.entries(filterState.categoricalSelections)) {
      if (selectedValues && selectedValues.length > 0) {
        const rowVal = row[colName];
        const strVal = rowVal !== null && rowVal !== undefined ? String(rowVal) : '(Empty)';
        if (!selectedValues.includes(strVal)) return false;
      }
    }

    // 4. Date range filters
    for (const [colName, range] of Object.entries(filterState.dateRanges)) {
      if (range.start || range.end) {
        const rowVal = row[colName];
        if (!rowVal) return false;
        const rowTime = new Date(rowVal).getTime();
        if (isNaN(rowTime)) return false;

        if (range.start) {
          const startTime = new Date(range.start).getTime();
          if (!isNaN(startTime) && rowTime < startTime) return false;
        }
        if (range.end) {
          const endTime = new Date(range.end).getTime();
          if (!isNaN(endTime) && rowTime > endTime) return false;
        }
      }
    }

    return true;
  });
}

/**
 * Count how many active filters are currently applied
 */
export function countActiveFilters(filterState: FilterState): number {
  let count = 0;
  if (filterState.search.trim()) count++;

  Object.values(filterState.numericRanges).forEach((r) => {
    if (r.currentMin > r.min || r.currentMax < r.max) count++;
  });

  Object.values(filterState.categoricalSelections).forEach((vals) => {
    if (vals.length > 0) count += vals.length;
  });

  return count;
}
