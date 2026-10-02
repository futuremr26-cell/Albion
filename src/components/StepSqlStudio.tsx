import React, { useState, useEffect } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Edit3,
  Layers,
  ChevronDown,
  Info,
  Sparkles,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';
import { KPIItem, DataProfile, SqlDialect, GeneratedSQL } from '../types';
import { runSqlWithAlaSql } from '../utils/dataEngine';
import { VisualChart } from './VisualChart';

interface StepSqlStudioProps {
  dataProfile: DataProfile | null;
  kpis: KPIItem[];
  selectedKpi: KPIItem | null;
  onSelectKpi: (kpi: KPIItem) => void;
  businessProblem: string;
  objectives: string;
  onKpiExecuted?: (kpiId: string, queryInfo: { sql: string; status: string; rowCount: number }) => void;
  onProceedToDashboard?: () => void;
}

const DIALECTS: SqlDialect[] = ['PostgreSQL', 'MySQL', 'BigQuery', 'SQL Server'];

export const StepSqlStudio: React.FC<StepSqlStudioProps> = ({
  dataProfile,
  kpis,
  selectedKpi,
  onSelectKpi,
  businessProblem,
  objectives,
  onKpiExecuted,
  onProceedToDashboard,
}) => {
  const [activeKpi, setActiveKpi] = useState<KPIItem | null>(selectedKpi || kpis[0] || null);
  const [dialect, setDialect] = useState<SqlDialect>('PostgreSQL');
  const [sqlQueries, setSqlQueries] = useState<Record<string, GeneratedSQL>>({});
  const [currentSql, setCurrentSql] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastFixExplanation, setLastFixExplanation] = useState<string | null>(null);

  // Sync active KPI when prop changes
  useEffect(() => {
    if (selectedKpi) {
      setActiveKpi(selectedKpi);
    } else if (!activeKpi && kpis.length > 0) {
      setActiveKpi(kpis[0]);
    }
  }, [selectedKpi, kpis]);

  // Sync currentSql when activeKpi changes
  useEffect(() => {
    if (activeKpi) {
      const existing = sqlQueries[activeKpi.name];
      if (existing) {
        setCurrentSql(existing.sql);
      } else {
        setCurrentSql('');
        setLastFixExplanation(null);
      }
    }
  }, [activeKpi, sqlQueries]);

  if (!dataProfile) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          No Dataset Available
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Please upload a dataset in Step 2 to generate and execute queries.
        </p>
      </div>
    );
  }

  const activeQueryObj = activeKpi ? sqlQueries[activeKpi.name] : null;

  // 1. Generate SQL with Gemini
  const handleGenerateSql = async () => {
    if (!activeKpi) return;
    setIsGenerating(true);
    setLastFixExplanation(null);

    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpi: activeKpi,
          dialect,
          schema: dataProfile.columns,
          sampleRows: dataProfile.previewRows.slice(0, 5),
          businessProblem,
          objectives,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate SQL');

      const generated: GeneratedSQL = {
        kpiId: activeKpi.name,
        dialect,
        sql: data.sql,
        explanation: data.explanation || 'Calculates metric from table data.',
        suggestedChart: data.suggestedChart,
      };

      setSqlQueries((prev) => ({
        ...prev,
        [activeKpi.name]: generated,
      }));
      setCurrentSql(data.sql);

      // Auto-run query immediately for seamless flow!
      setTimeout(() => {
        executeSql(data.sql, generated);
      }, 50);
    } catch (err: any) {
      console.error('Error generating SQL:', err);
      alert(err?.message || 'Could not generate SQL query.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Execute SQL with AlaSQL in browser
  const executeSql = (queryToRun: string, baseObj?: GeneratedSQL) => {
    if (!queryToRun || !activeKpi) return;
    const targetObj = baseObj || activeQueryObj;

    const result = runSqlWithAlaSql(queryToRun, dataProfile.allData);

    const updatedObj: GeneratedSQL = {
      ...(targetObj || {
        kpiId: activeKpi.name,
        dialect,
        sql: queryToRun,
        explanation: 'Custom query executed on table data.',
      }),
      sql: queryToRun,
      lastRunResult: result,
    };

    setSqlQueries((prev) => ({
      ...prev,
      [activeKpi.name]: updatedObj,
    }));

    if (onKpiExecuted) {
      onKpiExecuted(activeKpi.name, {
        sql: queryToRun,
        status: result.success ? 'Success' : 'Error',
        rowCount: result.data ? result.data.length : 0,
      });
    }
  };

  // 3. Fix with AI when query throws error
  const handleFixSql = async () => {
    if (!activeKpi || !activeQueryObj?.lastRunResult?.error) return;
    setIsFixing(true);

    try {
      const res = await fetch('/api/fix-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpi: activeKpi,
          sql: currentSql,
          error: activeQueryObj.lastRunResult.error,
          dialect,
          schema: dataProfile.columns,
          sampleRows: dataProfile.previewRows.slice(0, 5),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fix SQL');

      setCurrentSql(data.sql);
      setLastFixExplanation(data.explanation);

      const fixedObj: GeneratedSQL = {
        ...activeQueryObj,
        sql: data.sql,
        explanation: data.explanation || activeQueryObj.explanation,
        suggestedChart: data.suggestedChart || activeQueryObj.suggestedChart,
      };

      setSqlQueries((prev) => ({
        ...prev,
        [activeKpi.name]: fixedObj,
      }));

      // Automatically test the fixed query!
      executeSql(data.sql, fixedObj);
    } catch (err: any) {
      console.error('Error fixing SQL with AI:', err);
      alert(err?.message || 'Failed to fix SQL with AI.');
    } finally {
      setIsFixing(false);
    }
  };

  const handleCopySql = () => {
    if (!currentSql) return;
    navigator.clipboard.writeText(currentSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (!activeQueryObj?.lastRunResult?.data || activeQueryObj.lastRunResult.data.length === 0) return;
    const rows = activeQueryObj.lastRunResult.data;
    const keys = Object.keys(rows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        keys.join(','),
        ...rows.map((row) =>
          keys
            .map((k) => {
              const val = row[k];
              return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            })
            .join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeKpi?.name || 'query_result'}_insightbot.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Studio Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
              <Code2 className="w-3.5 h-3.5" />
              Step 4: SQL Generation &amp; Visual Studio
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Executable SQL &amp; Real-time Visuals
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gemini translates KPIs into queries on table <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">data</code>, runs them locally via in-memory AlaSQL, and auto-plots charts.
            </p>
          </div>

          {/* Dialect Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">
              Dialect:
            </span>
            <div className="flex gap-1">
              {DIALECTS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDialect(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dialect === d
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Selector Tabs */}
        {kpis.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Select KPI to Query:
            </span>
            <div className="flex flex-wrap gap-2">
              {kpis.map((kpi) => {
                const isSelected = activeKpi?.name === kpi.name;
                const hasRun = sqlQueries[kpi.name]?.lastRunResult?.success;

                return (
                  <button
                    key={kpi.name}
                    onClick={() => {
                      setActiveKpi(kpi);
                      onSelectKpi(kpi);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{kpi.name}</span>
                    {hasRun && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active KPI Details Card */}
      {activeKpi && (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {activeKpi.category || 'Metric'}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeKpi.name}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {activeKpi.definition}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Formula:</span>
              <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                {activeKpi.formula}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* SQL Editor & Execution Workspace */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              SQL Query ({dialect})
            </h3>
            {activeQueryObj?.explanation && (
              <span className="text-xs text-slate-400 hidden sm:inline">
                • {activeQueryObj.explanation}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Generate or Re-generate SQL button */}
            <button
              onClick={handleGenerateSql}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentSql ? 'Regenerate SQL' : 'Generate SQL'}</span>
                </>
              )}
            </button>

            {/* Copy button */}
            {currentSql && (
              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="Copy SQL to Clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}

            {/* Run Button (AlaSQL) */}
            {currentSql && (
              <button
                onClick={() => executeSql(currentSql)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run (AlaSQL)</span>
              </button>
            )}
          </div>
        </div>

        {/* Query Input / Code Block */}
        {currentSql ? (
          <div className="relative">
            <textarea
              rows={4}
              value={currentSql}
              onChange={(e) => setCurrentSql(e.target.value)}
              className="w-full font-mono text-xs sm:text-sm bg-slate-900 text-emerald-400 p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
              placeholder="SELECT ... FROM data ..."
            />
            <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 font-mono">
              Table name: data (in-memory)
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-3">
            <Code2 className="w-8 h-8 mx-auto text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No SQL Generated for {activeKpi?.name || 'this KPI'} Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Click below to prompt Gemini to construct the SQL query in {dialect} dialect against table <span className="font-mono font-bold">data</span>.
            </p>
            <button
              onClick={handleGenerateSql}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate SQL for {activeKpi?.name || 'KPI'}</span>
            </button>
          </div>
        )}

        {/* AI Fix Explanation Notification if recently fixed */}
        {lastFixExplanation && (
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5 animate-in fade-in duration-150">
            <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">AI Diagnostic &amp; Resolution:</span>
              <p className="text-purple-800 dark:text-purple-300 mt-0.5 leading-relaxed">
                {lastFixExplanation}
              </p>
            </div>
          </div>
        )}

        {/* Execution Results View */}
        {activeQueryObj?.lastRunResult && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            {/* Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                {activeQueryObj.lastRunResult.success ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Query Executed Successfully
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    Query Execution Failed
                  </span>
                )}

                <span className="text-slate-400">|</span>

                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {activeQueryObj.lastRunResult.executionTimeMs} ms
                </span>

                {activeQueryObj.lastRunResult.data && (
                  <>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono">
                      {activeQueryObj.lastRunResult.data.length} rows returned
                    </span>
                  </>
                )}
              </div>

              {/* Fix with AI Button if Error */}
              {!activeQueryObj.lastRunResult.success && (
                <button
                  onClick={handleFixSql}
                  disabled={isFixing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  {isFixing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Troubleshooting with AI...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Fix with AI</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Error Message Box */}
            {!activeQueryObj.lastRunResult.success && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs">
                <span className="font-bold text-red-800 dark:text-red-300 block mb-1">
                  Engine Error Details:
                </span>
                <pre className="font-mono text-red-700 dark:text-red-400 whitespace-pre-wrap break-all">
                  {activeQueryObj.lastRunResult.error}
                </pre>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleFixSql}
                    disabled={isFixing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Send Error to Gemini &amp; Auto-Fix</span>
                  </button>
                </div>
              </div>
            )}

            {/* Success: Chart & Table Visuals */}
            {activeQueryObj.lastRunResult.success && activeQueryObj.lastRunResult.data && (
              <div className="space-y-4">
                <VisualChart
                  data={activeQueryObj.lastRunResult.data}
                  columns={activeQueryObj.lastRunResult.columns || []}
                  suggestedConfig={activeQueryObj.suggestedChart}
                  onExportCsv={handleExportCsv}
                />
              </div>
            )}
          </div>
        )}

        {/* Proceed to Dashboard CTA */}
        {onProceedToDashboard && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onProceedToDashboard}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Proceed to Executive Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
