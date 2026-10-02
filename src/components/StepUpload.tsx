import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  ArrowRight,
  RefreshCw,
  Eye,
  FileUp,
  Trash2,
  LayoutDashboard,
} from 'lucide-react';
import { DataProfile } from '../types';
import { parseUploadedFile, profileDataset } from '../utils/dataEngine';

interface StepUploadProps {
  dataProfile: DataProfile | null;
  setDataProfile: (profile: DataProfile | null) => void;
  onProceedToKpis: () => void;
  onLoadSample: () => void;
  onOpenSupabase?: () => void;
  onUnloadDataset?: () => void;
  onProceedToDashboard?: () => void;
}

export const StepUpload: React.FC<StepUploadProps> = ({
  dataProfile,
  setDataProfile,
  onProceedToKpis,
  onLoadSample,
  onOpenSupabase,
  onUnloadDataset,
  onProceedToDashboard,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const parsedRows = await parseUploadedFile(file);
      if (!parsedRows || parsedRows.length === 0) {
        throw new Error('No rows found in the selected file.');
      }
      const profile = profileDataset(parsedRows, file.name, file.size);
      setDataProfile(profile);
    } catch (err: any) {
      console.error('File parsing failed:', err);
      setErrorMessage(err?.message || 'Failed to parse file. Please verify CSV or XLSX format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'number':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            <Hash className="w-3 h-3" />
            number
          </span>
        );
      case 'date':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
            <Calendar className="w-3 h-3" />
            date
          </span>
        );
      case 'boolean':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            <ToggleLeft className="w-3 h-3" />
            boolean
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Type className="w-3 h-3" />
            string
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Upload Zone Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
              <Database className="w-3.5 h-3.5" />
              Step 2: Data Ingestion &amp; Profiling
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Upload Dataset (CSV or Excel)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Parsed entirely in your browser using PapaParse &amp; SheetJS. Never sends full data to the cloud.
            </p>
          </div>

          {!dataProfile && (
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              Load Demo CSV
            </button>
          )}
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            {isLoading ? (
              <RefreshCw className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {isLoading ? 'Parsing dataset in-browser...' : 'Drag & drop your CSV or Excel file here'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Supports .CSV, .XLSX, and .XLS. Automatic header detection and type inference.
          </p>

          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
          >
            <FileUp className="w-3.5 h-3.5" />
            Select File from Device
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Dataset Profile View */}
      {dataProfile && (
        <div className="space-y-6">
          {/* Supabase Cloud Sync Strip */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Supabase Cloud Database Connected
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Target Project: <strong>Google AI Studio Test</strong> (<code className="font-mono">njityjdscgrwnzfhvckm</code>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenSupabase && (
                <button
                  type="button"
                  onClick={onOpenSupabase}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Save / Load in Supabase</span>
                </button>
              )}

              {onUnloadDataset && (
                <button
                  type="button"
                  onClick={onUnloadDataset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                  title="Remove uploaded dataset and in-memory table"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Unload Dataset</span>
                </button>
              )}
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Rows</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {dataProfile.rowCount.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">records</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Columns</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {dataProfile.columnCount}
                </span>
                <span className="text-xs text-slate-400">attributes</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">File Reference</span>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
                {dataProfile.fileName}
              </div>
              <span className="text-[11px] text-slate-400">
                {formatFileSize(dataProfile.fileSize)}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Table Name in SQL</span>
              <div className="mt-1 text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                data
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready for query
              </span>
            </div>
          </div>

          {/* Column Inferred Schema */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Column Profiling &amp; Types
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {dataProfile.columns.length} columns profiled
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Column Name</th>
                    <th className="py-2.5 px-3">Inferred Type</th>
                    <th className="py-2.5 px-3">Missing / Nulls</th>
                    <th className="py-2.5 px-3">Distinct Values</th>
                    <th className="py-2.5 px-3">Stats / Sample</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {dataProfile.columns.map((col) => {
                    const nullPct = dataProfile.rowCount > 0
                      ? Math.round((col.nullCount / dataProfile.rowCount) * 100)
                      : 0;

                    return (
                      <tr
                        key={col.name}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                          {col.name}
                        </td>
                        <td className="py-2.5 px-3">
                          {getTypeBadge(col.type)}
                        </td>
                        <td className="py-2.5 px-3">
                          {col.nullCount === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              0 (0%)
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {col.nullCount} ({nullPct}%)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {col.distinctCount}
                        </td>
                        <td className="py-2.5 px-3">
                          {col.type === 'number' && col.min !== undefined ? (
                            <span className="text-slate-500 font-mono text-[11px]">
                              min: {col.min}, max: {col.max}, mean: {col.mean}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {col.sampleValues.slice(0, 3).map((val, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-mono truncate max-w-[90px]"
                                >
                                  {String(val ?? 'null')}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 10-Row Preview Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  10-Row Data Preview
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                First {Math.min(10, dataProfile.rowCount)} of {dataProfile.rowCount} rows
              </span>
            </div>

            <div className="overflow-x-auto max-h-80 border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    {dataProfile.columns.map((col) => (
                      <th key={col.name} className="py-2.5 px-3 whitespace-nowrap font-mono">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dataProfile.previewRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                        {idx + 1}
                      </td>
                      {dataProfile.columns.map((col) => {
                        const val = row[col.name];
                        return (
                          <td
                            key={col.name}
                            className="py-2 px-3 whitespace-nowrap font-mono text-[11px]"
                          >
                            {val !== null && val !== undefined ? (
                              typeof val === 'number' ? (
                                (val % 1 !== 0 ? Number(val.toFixed(2)).toLocaleString() : val.toLocaleString())
                              ) : (
                                String(val)
                              )
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 italic">
                                null
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Next Step Banner CTA */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data profile verified. Ready to compute business metrics or generate an Executive Dashboard.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {onProceedToDashboard && (
                  <button
                    type="button"
                    onClick={onProceedToDashboard}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>View AI Dashboard</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onProceedToKpis}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <span>Identify Strategic KPIs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
