import React, { useState, useEffect, useMemo, useId } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  RefreshCw,
  Filter,
  Download,
  Plus,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Code2,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Printer,
  ChevronDown,
  X,
  Play,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DataProfile, KPIItem, DashboardWidget, DashboardConfig, WidgetType } from '../types';
import { runSqlWithAlaSql } from '../utils/dataEngine';

interface StepDashboardProps {
  dataProfile: DataProfile | null;
  businessProblem: string;
  objectives: string;
  kpis: KPIItem[];
  onGoToUpload: () => void;
  onOpenSupabase?: () => void;
}

const PALETTE = [
  '#4f46e5', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#f97316', // orange
  '#14b8a6', // teal
];

function formatMetricValue(val: any): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) {
      return (val / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'M';
    }
    if (Math.abs(val) >= 1_000) {
      return (val / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'K';
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(val);
}

export const StepDashboard: React.FC<StepDashboardProps> = ({
  dataProfile,
  businessProblem,
  objectives,
  kpis,
  onGoToUpload,
  onOpenSupabase,
}) => {
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active filter state
  const [filterCol, setFilterCol] = useState<string>('');
  const [filterVal, setFilterVal] = useState<string>('ALL');

  // Widget editing / SQL view state
  const [activeSqlWidget, setActiveSqlWidget] = useState<DashboardWidget | null>(null);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [newWidgetPrompt, setNewWidgetPrompt] = useState('');
  const [newWidgetSql, setNewWidgetSql] = useState('');
  const [newWidgetType, setNewWidgetType] = useState<WidgetType>('bar');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [isGeneratingCustomWidget, setIsGeneratingCustomWidget] = useState(false);

  // Available categorical columns for global filter
  const categoricalCols = useMemo(() => {
    if (!dataProfile) return [];
    return dataProfile.columns.filter((c) => c.type === 'string' && c.distinctCount <= 40);
  }, [dataProfile]);

  // Distinct values for chosen filter column
  const filterColValues = useMemo(() => {
    if (!dataProfile || !filterCol) return [];
    const set = new Set<string>();
    dataProfile.allData.forEach((row) => {
      const v = row[filterCol];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        set.add(String(v));
      }
    });
    return Array.from(set).sort();
  }, [dataProfile, filterCol]);

  // Filtered dataset according to active global dimension filter
  const filteredDataset = useMemo(() => {
    if (!dataProfile) return [];
    if (!filterCol || filterVal === 'ALL') return dataProfile.allData;
    return dataProfile.allData.filter((row) => String(row[filterCol]) === filterVal);
  }, [dataProfile, filterCol, filterVal]);

  // Execute a widget's query against active dataset
  const executeWidgetQuery = (widget: DashboardWidget, dataset: Record<string, any>[]): DashboardWidget => {
    const res = runSqlWithAlaSql(widget.sql, dataset);
    if (!res.success) {
      return {
        ...widget,
        status: 'error',
        error: res.error,
        executionTimeMs: res.executionTimeMs,
      };
    }

    const rows = res.data || [];
    let metricValue = widget.metricValue;
    if (widget.type === 'metric' && rows.length > 0) {
      const firstRow = rows[0];
      const firstKey = Object.keys(firstRow)[0];
      metricValue = firstRow[firstKey];
    }

    return {
      ...widget,
      status: 'success',
      data: rows,
      columns: res.columns,
      metricValue: metricValue !== undefined ? metricValue : widget.metricValue,
      executionTimeMs: res.executionTimeMs,
      error: undefined,
    };
  };

  // Re-run all widgets when filteredDataset changes or dashboard is initialized
  useEffect(() => {
    if (!dashboardConfig || !filteredDataset || filteredDataset.length === 0) return;

    setDashboardConfig((prev) => {
      if (!prev) return null;
      const updatedWidgets = prev.widgets.map((w) => executeWidgetQuery(w, filteredDataset));
      return { ...prev, widgets: updatedWidgets };
    });
  }, [filteredDataset]);

  // Generate Executive Dashboard via API
  const handleGenerateDashboard = async () => {
    if (!dataProfile || dataProfile.rowCount === 0) {
      setGenerationError('Please upload a dataset first.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProblem,
          objectives,
          schema: dataProfile.columns,
          sampleRows: dataProfile.previewRows.slice(0, 5),
          kpis,
        }),
      });

      const config: DashboardConfig = await res.json();
      if (!res.ok && !config.widgets) {
        throw new Error((config as any).error || 'Failed to synthesize dashboard.');
      }

      // Execute initial queries for each widget
      const initialWidgets = (config.widgets || []).map((w) =>
        executeWidgetQuery(w, dataProfile.allData)
      );

      setDashboardConfig({
        ...config,
        widgets: initialWidgets,
      });

      // Default filter col if available
      if (config.activeFilterColumn && categoricalCols.some((c) => c.name === config.activeFilterColumn)) {
        setFilterCol(config.activeFilterColumn);
        setFilterVal('ALL');
      } else if (categoricalCols.length > 0 && !filterCol) {
        setFilterCol(categoricalCols[0].name);
        setFilterVal('ALL');
      }
    } catch (err: any) {
      console.error('Error generating dashboard:', err);
      setGenerationError(err?.message || 'Failed to generate dashboard.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate dashboard on first entry if dataset is present and no dashboard exists
  useEffect(() => {
    if (dataProfile && dataProfile.rowCount > 0 && !dashboardConfig && !isGenerating) {
      handleGenerateDashboard();
    }
  }, [dataProfile]);

  // Toggle chart type for a specific widget
  const handleToggleWidgetType = (widgetId: string, nextType: WidgetType) => {
    setDashboardConfig((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        widgets: prev.widgets.map((w) => (w.id === widgetId ? { ...w, type: nextType } : w)),
      };
    });
  };

  // Export Widget Data as CSV
  const handleExportWidgetCsv = (widget: DashboardWidget) => {
    if (!widget.data || widget.data.length === 0) return;
    const cols = widget.columns || Object.keys(widget.data[0]);
    const header = cols.join(',');
    const rows = widget.data.map((row) => cols.map((c) => JSON.stringify(row[c] ?? '')).join(','));
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${widget.title.toLowerCase().replace(/\s+/g, '_')}_data.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Add custom widget
  const handleAddCustomWidget = () => {
    if (!newWidgetTitle.trim() || !newWidgetSql.trim()) return;

    const newWidget: DashboardWidget = {
      id: `w-custom-${Date.now()}`,
      title: newWidgetTitle.trim(),
      type: newWidgetType,
      sql: newWidgetSql.trim(),
      width: newWidgetType === 'table' ? 'full' : 'half',
      description: 'Custom Analytical Widget',
    };

    const executed = executeWidgetQuery(newWidget, filteredDataset);

    setDashboardConfig((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        widgets: [...prev.widgets, executed],
      };
    });

    setIsAddWidgetOpen(false);
    setNewWidgetTitle('');
    setNewWidgetSql('');
  };

  if (!dataProfile) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          No Dataset Uploaded Yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
          Upload a dataset in Step 2 to generate an Executive Dashboard with KPI scorecards, charts, and breakdown matrices.
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

  // Split widgets into metric cards and chart/table widgets
  const metricWidgets = dashboardConfig?.widgets.filter((w) => w.type === 'metric') || [];
  const visualWidgets = dashboardConfig?.widgets.filter((w) => w.type !== 'metric') || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Dashboard Top Navigation & Controls Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Step 5: Executive AI Dashboard
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {dashboardConfig?.title || 'Executive Analytics Dashboard'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {dashboardConfig?.subtitle || 'AI-synthesized operational overview and performance distribution'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Regenerate AI Dashboard */}
          <button
            type="button"
            onClick={handleGenerateDashboard}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            )}
            <span>{isGenerating ? 'Synthesizing...' : 'Regenerate Dashboard'}</span>
          </button>

          {/* Add Custom Widget */}
          <button
            type="button"
            onClick={() => setIsAddWidgetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Widget</span>
          </button>

          {/* Print / Export Report */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Print or Export Dashboard as PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Dimension Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Global Slice &amp; Filter:</span>
          </div>

          {categoricalCols.length > 0 ? (
            <>
              {/* Column selector */}
              <select
                value={filterCol}
                onChange={(e) => {
                  setFilterCol(e.target.value);
                  setFilterVal('ALL');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {categoricalCols.map((c) => (
                  <option key={c.name} value={c.name}>
                    Dimension: {c.name}
                  </option>
                ))}
              </select>

              {/* Value selector */}
              <select
                value={filterVal}
                onChange={(e) => setFilterVal(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All {filterCol} Categories</option>
                {filterColValues.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <span className="text-slate-400 italic">No discrete categorical columns for filtering</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Layers className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            Active rows evaluated: <strong className="text-slate-900 dark:text-white font-mono">{filteredDataset.length.toLocaleString()}</strong> of {dataProfile.rowCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Generation Error Banner */}
      {generationError && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{generationError}</span>
          </div>
          <button
            onClick={handleGenerateDashboard}
            className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Row 1: Executive Metric Scorecards */}
      {metricWidgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricWidgets.map((widget, idx) => (
            <div
              key={widget.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300">
                  {widget.title}
                </span>
                <button
                  onClick={() => setActiveSqlWidget(widget)}
                  className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Inspect SQL Query"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatMetricValue(widget.metricValue)}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                  {widget.trendDirection === 'down' ? (
                    <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                  ) : widget.trendDirection === 'neutral' ? (
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  <span>{widget.trendSubtext || 'Live SQL'}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 truncate">
                {widget.description || widget.sql}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Row 2+: Visual Charts & Breakdown Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visualWidgets.map((widget) => {
          const isFullWidth = widget.width === 'full' || widget.type === 'table';
          return (
            <div
              key={widget.id}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between ${
                isFullWidth ? 'lg:col-span-2' : ''
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {widget.title}
                  </h3>
                  {widget.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {widget.description}
                    </p>
                  )}
                </div>

                {/* Widget Toolbar */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {/* Chart type toggles (if not table) */}
                  {widget.type !== 'table' && (
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-slate-600 dark:text-slate-400 text-xs">
                      <button
                        onClick={() => handleToggleWidgetType(widget.id, 'bar')}
                        className={`p-1.5 rounded-md ${widget.type === 'bar' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                        title="Bar Chart"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleWidgetType(widget.id, 'line')}
                        className={`p-1.5 rounded-md ${widget.type === 'line' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                        title="Line Chart"
                      >
                        <LineChartIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleWidgetType(widget.id, 'pie')}
                        className={`p-1.5 rounded-md ${widget.type === 'pie' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                        title="Donut / Pie Chart"
                      >
                        <PieChartIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* View SQL Query */}
                  <button
                    onClick={() => setActiveSqlWidget(widget)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="View SQL Query"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>

                  {/* Export CSV */}
                  <button
                    onClick={() => handleExportWidgetCsv(widget)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Export Chart Data as CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body: Visualization or Table */}
              <div className="flex-1 min-h-[280px]">
                {widget.status === 'error' ? (
                  <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    <span>Error executing query: {widget.error}</span>
                  </div>
                ) : !widget.data || widget.data.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No matching records found for active slice
                  </div>
                ) : widget.type === 'table' ? (
                  /* Matrix Table Rendering */
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          {(widget.columns || Object.keys(widget.data[0])).map((col) => (
                            <th key={col} className="px-4 py-2.5 capitalize font-mono text-[11px]">
                              {col.replace(/[_-]/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {widget.data.slice(0, 10).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            {(widget.columns || Object.keys(row)).map((col) => (
                              <td key={col} className="px-4 py-2 text-slate-700 dark:text-slate-300">
                                {typeof row[col] === 'number'
                                  ? formatMetricValue(row[col])
                                  : String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Recharts Visualization Rendering */
                  <div className="h-[280px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {widget.type === 'pie' ? (
                        <PieChart>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Pie
                            data={widget.data}
                            dataKey={widget.yKey || Object.keys(widget.data[0])[1]}
                            nameKey={widget.xKey || Object.keys(widget.data[0])[0]}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                          >
                            {widget.data.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      ) : widget.type === 'line' ? (
                        <LineChart data={widget.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis
                            dataKey={widget.xKey || Object.keys(widget.data[0])[0]}
                            tick={{ fontSize: 11 }}
                            stroke="#888"
                          />
                          <YAxis tick={{ fontSize: 11 }} stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey={widget.yKey || Object.keys(widget.data[0])[1]}
                            stroke="#4f46e5"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      ) : widget.type === 'area' ? (
                        <AreaChart data={widget.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`colorGrad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis
                            dataKey={widget.xKey || Object.keys(widget.data[0])[0]}
                            tick={{ fontSize: 11 }}
                            stroke="#888"
                          />
                          <YAxis tick={{ fontSize: 11 }} stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey={widget.yKey || Object.keys(widget.data[0])[1]}
                            stroke="#4f46e5"
                            fillOpacity={1}
                            fill={`url(#colorGrad-${widget.id})`}
                          />
                        </AreaChart>
                      ) : (
                        /* Bar Chart Default */
                        <BarChart data={widget.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis
                            dataKey={widget.xKey || Object.keys(widget.data[0])[0]}
                            tick={{ fontSize: 11 }}
                            stroke="#888"
                          />
                          <YAxis tick={{ fontSize: 11 }} stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Bar
                            dataKey={widget.yKey || Object.keys(widget.data[0])[1]}
                            fill="#4f46e5"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Query executed in <strong className="font-mono text-slate-600 dark:text-slate-300">{widget.executionTimeMs || 0}ms</strong>
                </span>
                <span className="font-mono text-indigo-500">FROM data</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SQL Inspection Modal */}
      {activeSqlWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-500" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeSqlWidget.title} — SQL Query
                </h4>
              </div>
              <button
                onClick={() => setActiveSqlWidget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
              <code>{activeSqlWidget.sql}</code>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Executed dynamically via in-browser AlaSQL engine.</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeSqlWidget.sql);
                  setActiveSqlWidget(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
              >
                Copy SQL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Widget Modal */}
      {isAddWidgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Custom Dashboard Widget
                </h4>
              </div>
              <button
                onClick={() => setIsAddWidgetOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Widget Title
                </label>
                <input
                  type="text"
                  value={newWidgetTitle}
                  onChange={(e) => setNewWidgetTitle(e.target.value)}
                  placeholder="e.g. Sales by Payment Method"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Type
                </label>
                <select
                  value={newWidgetType}
                  onChange={(e) => setNewWidgetType(e.target.value as WidgetType)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Donut / Pie Chart</option>
                  <option value="table">Breakdown Table</option>
                  <option value="metric">Metric Scorecard</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  SQL Query (Table: data)
                </label>
                <textarea
                  value={newWidgetSql}
                  onChange={(e) => setNewWidgetSql(e.target.value)}
                  rows={4}
                  placeholder={`SELECT category, SUM(revenue) AS total FROM data GROUP BY category`}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddWidgetOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomWidget}
                disabled={!newWidgetTitle.trim() || !newWidgetSql.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                Add to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
