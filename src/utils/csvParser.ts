import Papa from 'papaparse';
import { ColumnMeta, ColumnType, Dataset } from '../types/data';

/**
 * Clean and detect the actual primitive type of a string value
 */
function cleanAndCastValue(val: any): { value: any; type: ColumnType } {
  if (val === null || val === undefined) {
    return { value: null, type: 'string' };
  }
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'nan') {
    return { value: null, type: 'string' };
  }

  // Boolean check
  const lower = s.toLowerCase();
  if (lower === 'true' || lower === 'yes') return { value: true, type: 'boolean' };
  if (lower === 'false' || lower === 'no') return { value: false, type: 'boolean' };

  // Number check (strip $, €, £, %, commas)
  const cleanNumStr = s.replace(/^[$€£¥]/, '').replace(/%$/, '').replace(/,/g, '').trim();
  if (cleanNumStr !== '' && !isNaN(Number(cleanNumStr)) && !isNaN(parseFloat(cleanNumStr))) {
    return { value: parseFloat(cleanNumStr), type: 'number' };
  }

  // Date check (avoid converting single digits or pure years to dates)
  if (s.length >= 8 && (s.includes('-') || s.includes('/') || s.includes('.'))) {
    const parsedDate = Date.parse(s);
    if (!isNaN(parsedDate) && s.match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/)) {
      return { value: new Date(parsedDate).toISOString(), type: 'date' };
    }
  }

  return { value: s, type: 'string' };
}

/**
 * Infer column schema, types, and summary statistics
 */
export function inferColumnMetadata(rows: Record<string, any>[], columnNames: string[]): ColumnMeta[] {
  return columnNames.map((colName) => {
    let numberCount = 0;
    let dateCount = 0;
    let boolCount = 0;
    let stringCount = 0;
    let nullCount = 0;

    const values: any[] = [];
    const uniqueSet = new Set<string>();

    rows.forEach((row) => {
      const v = row[colName];
      if (v === null || v === undefined || v === '') {
        nullCount++;
      } else {
        values.push(v);
        uniqueSet.add(String(v));
        if (typeof v === 'number') numberCount++;
        else if (typeof v === 'boolean') boolCount++;
        else if (typeof v === 'string' && !isNaN(Date.parse(v)) && (v.includes('-') || v.includes('/'))) dateCount++;
        else stringCount++;
      }
    });

    const totalValid = values.length;
    let detectedType: ColumnType = 'string';

    if (totalValid > 0) {
      if (numberCount / totalValid >= 0.7) detectedType = 'number';
      else if (boolCount / totalValid >= 0.7) detectedType = 'boolean';
      else if (dateCount / totalValid >= 0.7) detectedType = 'date';
      else detectedType = 'string';
    }

    // Convert values if column type is determined
    if (detectedType === 'number') {
      rows.forEach((row) => {
        const v = row[colName];
        if (v !== null && v !== undefined && typeof v !== 'number') {
          const num = parseFloat(String(v).replace(/^[$€£¥]/, '').replace(/%$/, '').replace(/,/g, '').trim());
          row[colName] = isNaN(num) ? null : num;
        }
      });
    }

    const distinctValues = Array.from(uniqueSet).slice(0, 100);

    const meta: ColumnMeta = {
      name: colName,
      type: detectedType,
      sampleValues: values.slice(0, 5),
      uniqueCount: uniqueSet.size,
      nullCount,
      distinctValues,
    };

    if (detectedType === 'number') {
      const numVals = values.map((v) => Number(v)).filter((n) => !isNaN(n));
      if (numVals.length > 0) {
        numVals.sort((a, b) => a - b);
        const sum = numVals.reduce((acc, curr) => acc + curr, 0);
        meta.min = numVals[0];
        meta.max = numVals[numVals.length - 1];
        meta.sum = sum;
        meta.avg = sum / numVals.length;
        const mid = Math.floor(numVals.length / 2);
        meta.median = numVals.length % 2 !== 0 ? numVals[mid] : (numVals[mid - 1] + numVals[mid]) / 2;
      }
    } else if (detectedType === 'date') {
      const dateVals = values.filter((v) => !isNaN(Date.parse(String(v)))).sort();
      if (dateVals.length > 0) {
        meta.min = dateVals[0];
        meta.max = dateVals[dateVals.length - 1];
      }
    }

    return meta;
  });
}

/**
 * Parse raw CSV text into a structured Dataset
 */
export function parseCSV(csvText: string, datasetName = 'Imported Dataset', source: 'upload' | 'sample' | 'paste' = 'upload'): Dataset {
  const parsed = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (!parsed.data || parsed.data.length === 0) {
    throw new Error('CSV is empty or could not be parsed.');
  }

  const rawColumns = parsed.meta.fields || Object.keys(parsed.data[0]);
  const cleanedColumns = rawColumns.map((col) => col.trim()).filter((col) => col.length > 0);

  // Cast each cell
  const cleanedRows: Record<string, any>[] = parsed.data.map((row) => {
    const newRow: Record<string, any> = {};
    cleanedColumns.forEach((col) => {
      const rawVal = row[col];
      const { value } = cleanAndCastValue(rawVal);
      newRow[col] = value;
    });
    return newRow;
  });

  const columnMeta = inferColumnMetadata(cleanedRows, cleanedColumns);

  return {
    id: 'ds_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: datasetName,
    rowCount: cleanedRows.length,
    columnCount: cleanedColumns.length,
    columns: columnMeta,
    rows: cleanedRows,
    source,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Export rows to CSV file download
 */
export function exportToCSV(rows: Record<string, any>[], filename = 'export.csv') {
  if (!rows || rows.length === 0) return;
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
