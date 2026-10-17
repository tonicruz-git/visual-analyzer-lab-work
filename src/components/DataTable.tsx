import React, { useState, useMemo } from 'react';
import { ColumnMeta } from '../types/data';
import { exportToCSV } from '../utils/csvParser';
import { formatValue } from '../utils/formatting';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';

interface DataTableProps {
  columns: ColumnMeta[];
  rows: Record<string, any>[];
  datasetName: string;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, rows, datasetName }) => {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedColMeta, setSelectedColMeta] = useState<ColumnMeta | null>(null);
  const pageSize = 25;

  // Sorting
  const sortedRows = useMemo(() => {
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [rows, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (colName: string) => {
    if (sortCol === colName) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(colName);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{datasetName}</h3>
            <p className="text-xs text-slate-500">
              Showing {rows.length.toLocaleString()} records across {columns.length} columns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(rows, `${datasetName}_filtered.csv`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Column Schema Quick Pill Bar */}
      <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-slate-400 font-medium shrink-0">Column Profiler:</span>
        {columns.map((col) => (
          <button
            key={col.name}
            onClick={() => setSelectedColMeta(selectedColMeta?.name === col.name ? null : col)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 flex items-center gap-1 transition-colors cursor-pointer ${
              selectedColMeta?.name === col.name
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span>{col.name}</span>
            <span className="text-[9px] opacity-75">({col.type})</span>
          </button>
        ))}
      </div>

      {/* Column Metadata Inspection Banner */}
      {selectedColMeta && (
        <div className="px-5 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-indigo-950">
            <div className="font-semibold flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>Column: {selectedColMeta.name}</span>
            </div>
            <div>
              Unique Values:{' '}
              <span className="font-mono font-medium">{selectedColMeta.uniqueCount}</span>
            </div>
            {selectedColMeta.type === 'number' && (
              <>
                <div>
                  Min: <span className="font-mono">{formatValue(selectedColMeta.min)}</span>
                </div>
                <div>
                  Max: <span className="font-mono">{formatValue(selectedColMeta.max)}</span>
                </div>
                <div>
                  Avg: <span className="font-mono">{formatValue(selectedColMeta.avg)}</span>
                </div>
                <div>
                  Median: <span className="font-mono">{formatValue(selectedColMeta.median)}</span>
                </div>
              </>
            )}
            <div>
              Null Count:{' '}
              <span className="font-mono text-slate-500">{selectedColMeta.nullCount}</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedColMeta(null)}
            className="text-xs text-indigo-600 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scrollable Data Grid */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4 font-semibold text-slate-500 text-[11px] w-12 text-center">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.name}
                  onClick={() => handleSort(col.name)}
                  className="py-2.5 px-4 font-semibold text-slate-700 text-[11px] hover:bg-slate-100/70 transition-colors cursor-pointer select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.name}</span>
                    {sortCol === col.name ? (
                      sortDir === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.map((row, rIdx) => {
              const rowIndex = (currentPage - 1) * pageSize + rIdx + 1;
              return (
                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-4 text-slate-400 font-mono text-[10px] text-center tabular-nums">
                    {rowIndex}
                  </td>
                  {columns.map((col) => {
                    const val = row[col.name];
                    const isNum = col.type === 'number';

                    return (
                      <td
                        key={col.name}
                        className={`py-2 px-4 whitespace-nowrap text-slate-700 ${
                          isNum ? 'text-right font-mono tabular-nums text-slate-800' : ''
                        }`}
                      >
                        {val === null || val === undefined ? (
                          <span className="text-slate-300 italic text-[11px]">null</span>
                        ) : typeof val === 'boolean' ? (
                          <span className={val ? 'text-emerald-600' : 'text-slate-500'}>
                            {val ? 'Yes' : 'No'}
                          </span>
                        ) : isNum ? (
                          val.toLocaleString()
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing{' '}
          <span className="font-mono tabular-nums font-semibold text-slate-800">
            {Math.min(rows.length, (currentPage - 1) * pageSize + 1)}
          </span>{' '}
          to{' '}
          <span className="font-mono tabular-nums font-semibold text-slate-800">
            {Math.min(rows.length, currentPage * pageSize)}
          </span>{' '}
          of{' '}
          <span className="font-mono tabular-nums font-semibold text-slate-800">
            {rows.length.toLocaleString()}
          </span>{' '}
          rows
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono tabular-nums text-xs">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
