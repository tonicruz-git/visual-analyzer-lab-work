import React, { useState, useRef } from 'react';
import { parseCSV } from '../utils/csvParser';
import { Dataset, ChartConfig } from '../types/data';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Sparkles, FolderOpen } from 'lucide-react';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (dataset: Dataset, recommendedCharts?: ChartConfig[]) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
}) => {
  const [tab, setTab] = useState<'upload' | 'samples' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [datasetName, setDatasetName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && !file.name.endsWith('.txt')) {
      setError('Please select a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const name = file.name.replace(/\.[^/.]+$/, '');
        const ds = parseCSV(text, name, 'upload');
        onDatasetLoaded(ds);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file. Ensure it has valid header rows.');
      }
    };
    reader.onerror = () => {
      setError('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    setError(null);
    if (!pasteText.trim()) {
      setError('Please paste CSV contents into the text box.');
      return;
    }
    try {
      const name = datasetName.trim() || 'Custom Dataset';
      const ds = parseCSV(pasteText, name, 'paste');
      onDatasetLoaded(ds);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to parse pasted CSV. Check row and delimiter formats.');
    }
  };

  const handleSampleSelect = (sampleId: string) => {
    const s = SAMPLE_DATASETS.find((d) => d.id === sampleId);
    if (!s) return;
    const ds = parseCSV(s.csv, s.name, 'sample');
    const charts: ChartConfig[] = s.recommendedCharts.map((rc, idx) => ({
      ...rc,
      id: 'chart_' + Date.now() + '_' + idx,
    }));
    onDatasetLoaded(ds, charts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Load Dataset</h2>
            <p className="text-xs text-slate-500">Plug in any custom CSV file, paste rows, or select ready sample sets</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-4">
          <button
            onClick={() => { setTab('upload'); setError(null); }}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'upload' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            onClick={() => { setTab('samples'); setError(null); }}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'samples' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Curated Datasets
          </button>
          <button
            onClick={() => { setTab('paste'); setError(null); }}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'paste' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste CSV Text
          </button>
        </div>

        {/* Body content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'upload' && (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Drag & drop your CSV file here
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Supports comma, semicolon, and tab-delimited files of any size
                </p>
                <span className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 shadow-xs">
                  Browse Files
                </span>
              </div>
            </div>
          )}

          {tab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Select a rich multi-dimensional dataset with auto-configured dashboards:
              </p>
              {SAMPLE_DATASETS.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSampleSelect(s.id)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {s.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{s.description}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    Load Set
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Dataset Name</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g. Sales Q3 Export"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Paste Raw CSV (including header row)
                </label>
                <textarea
                  rows={8}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Date,Category,Revenue,Units\n2024-01-01,Hardware,4500,12\n2024-01-02,Software,8900,28`}
                  className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 focus:outline-indigo-600 bg-slate-50/50"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Parse & Ingest CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
