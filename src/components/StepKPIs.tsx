import React, { useState } from 'react';
import {
  Sparkles,
  BarChart2,
  Code2,
  RefreshCw,
  Columns,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Info,
  ArrowRight,
  Calculator,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { KPIItem, DataProfile } from '../types';

interface StepKPIsProps {
  businessProblem: string;
  objectives: string;
  dataProfile: DataProfile | null;
  kpis: KPIItem[];
  onIdentifyKpis: () => Promise<void>;
  isLoadingKpis: boolean;
  onSelectKpiForSql: (kpi: KPIItem) => void;
  onGoToUpload: () => void;
  kpiError?: string | null;
}

export const StepKPIs: React.FC<StepKPIsProps> = ({
  businessProblem,
  objectives,
  dataProfile,
  kpis,
  onIdentifyKpis,
  isLoadingKpis,
  onSelectKpiForSql,
  onGoToUpload,
  kpiError,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!dataProfile) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          No Dataset Uploaded Yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
          Please upload a CSV or XLSX dataset first so Gemini can evaluate your schema and sample rows.
        </p>
        <button
          onClick={onGoToUpload}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          <span>Go to Data Upload</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Get distinct categories
  const categories = ['All', ...Array.from(new Set(kpis.map((k) => k.category || 'Metric')))];
  const filteredKpis =
    selectedCategory === 'All'
      ? kpis
      : kpis.filter((k) => (k.category || 'Metric') === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header and CTA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
              <BarChart2 className="w-3.5 h-3.5" />
              Step 3: Strategic Metric Discovery
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              AI-Identified Key Performance Indicators (KPIs)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Synthesized from your business problem, project objectives, and column schema ({dataProfile.columns.length} columns available).
            </p>
          </div>

          <button
            type="button"
            onClick={onIdentifyKpis}
            disabled={isLoadingKpis}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLoadingKpis ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Formulating KPIs with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{kpis.length > 0 ? 'Regenerate KPIs' : 'Identify KPIs'}</span>
              </>
            )}
          </button>
        </div>

        {/* Context Summary Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
            <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
              Active Business Problem:
            </span>
            <p className="line-clamp-2 italic text-slate-600 dark:text-slate-300">
              "{businessProblem || 'General analysis'}"
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
            <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
              Target Schema &amp; Data:
            </span>
            <p className="line-clamp-2 text-slate-600 dark:text-slate-300">
              Table <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">data</span> with {dataProfile.rowCount} records across: {dataProfile.columns.map(c => c.name).slice(0, 6).join(', ')}{dataProfile.columns.length > 6 ? '...' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Error Alert Banner */}
      {kpiError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Notice during KPI Identification:</span>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">{kpiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onIdentifyKpis}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-2xs transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoadingKpis && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Formulating mathematically grounded KPIs...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Gemini is correlating your business problem against schema column types and sample distributions.
          </p>
        </div>
      )}

      {/* Empty State before first generation */}
      {!isLoadingKpis && kpis.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Ready to Discover KPIs
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Click "Identify KPIs" above to extract operational metrics, exact mathematical formulas, and columns used.
          </p>
          <button
            type="button"
            onClick={onIdentifyKpis}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Identify KPIs with Gemini</span>
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      {!isLoadingKpis && kpis.length > 0 && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Filter by Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredKpis.map((kpi, idx) => (
              <div
                key={kpi.id || idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {kpi.category || 'Metric'}
                        </span>
                        {kpi.targetDirection && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                            {kpi.targetDirection === 'higher' ? (
                              <TrendingUp className="w-3 h-3 text-emerald-500" />
                            ) : kpi.targetDirection === 'lower' ? (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            ) : null}
                            Target: {kpi.targetDirection}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {kpi.name}
                      </h3>
                    </div>
                  </div>

                  {/* Definition */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {kpi.definition}
                  </p>

                  {/* Formula Block */}
                  <div className="mb-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                      Formula:
                    </div>
                    <code className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-300 block break-all">
                      {kpi.formula}
                    </code>
                  </div>

                  {/* Columns Used */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      <Columns className="w-3.5 h-3.5 text-slate-400" />
                      Columns Used:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {kpi.columns_used && kpi.columns_used.length > 0 ? (
                        kpi.columns_used.map((col) => (
                          <span
                            key={col}
                            className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {col}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">None specified</span>
                      )}
                    </div>
                  </div>

                  {/* Why it Matters */}
                  <div className="mb-5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-3 border border-blue-100 dark:border-blue-900/40">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-1">
                      <Info className="w-3.5 h-3.5" />
                      Strategic Impact:
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {kpi.why_it_matters}
                    </p>
                  </div>
                </div>

                {/* Card Action CTA */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onSelectKpiForSql(kpi)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Generate SQL for this KPI</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
