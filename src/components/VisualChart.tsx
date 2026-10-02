import React, { useMemo, useState } from 'react';
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
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, PieChart as PieChartIcon, Download, Table, Layers } from 'lucide-react';

interface VisualChartProps {
  data: any[];
  columns: string[];
  suggestedConfig?: {
    type?: 'bar' | 'line' | 'area' | 'pie';
    xKey?: string;
    yKey?: string;
    title?: string;
  };
  onExportCsv?: () => void;
}

const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
];

export const VisualChart: React.FC<VisualChartProps> = ({
  data,
  columns,
  suggestedConfig,
  onExportCsv,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Auto-detect categorical vs numerical columns
  const { numericCols, stringCols } = useMemo(() => {
    if (!data || data.length === 0) return { numericCols: [], stringCols: [] };
    const num: string[] = [];
    const str: string[] = [];

    columns.forEach((col) => {
      const isNum = data.some(
        (row) => row[col] !== null && row[col] !== undefined && !isNaN(Number(row[col]))
      );
      if (isNum) {
        num.push(col);
      } else {
        str.push(col);
      }
    });

    return { numericCols: num, stringCols: str };
  }, [data, columns]);

  const defaultXKey = useMemo(() => {
    if (suggestedConfig?.xKey && columns.includes(suggestedConfig.xKey)) {
      return suggestedConfig.xKey;
    }
    if (stringCols.length > 0) return stringCols[0];
    return columns[0] || '';
  }, [suggestedConfig, columns, stringCols]);

  const defaultYKey = useMemo(() => {
    if (suggestedConfig?.yKey && columns.includes(suggestedConfig.yKey)) {
      return suggestedConfig.yKey;
    }
    if (numericCols.length > 0) return numericCols[0];
    return columns[1] || columns[0] || '';
  }, [suggestedConfig, columns, numericCols]);

  const [xKey, setXKey] = useState<string>(defaultXKey);
  const [yKey, setYKey] = useState<string>(defaultYKey);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>(
    suggestedConfig?.type || 'bar'
  );

  // Sync when suggestedConfig or columns change
  React.useEffect(() => {
    if (defaultXKey) setXKey(defaultXKey);
    if (defaultYKey) setYKey(defaultYKey);
    if (suggestedConfig?.type) setChartType(suggestedConfig.type);
  }, [defaultXKey, defaultYKey, suggestedConfig]);

  // Clean data for Recharts (convert numeric values)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item, idx) => {
      const row: any = { ...item };
      const rawY = item[yKey];
      const parsedY = Number(rawY);
      row[yKey] = !isNaN(parsedY) ? parsedY : 0;
      row._label = item[xKey] !== undefined ? String(item[xKey]) : `Row ${idx + 1}`;
      return row;
    });
  }, [data, xKey, yKey]);

  // Summary statistics for yKey
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    const values = chartData
      .map((d) => d[yKey])
      .filter((v) => typeof v === 'number' && !isNaN(v));
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      sum: Number(sum.toFixed(2)),
      avg: Number(avg.toFixed(2)),
      max: Number(max.toFixed(2)),
      min: Number(min.toFixed(2)),
      count: values.length,
    };
  }, [chartData, yKey]);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
        No query records available to visualize.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
              {suggestedConfig?.title || 'Interactive Query Visualization'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Plotting {data.length} records dynamically
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle (chart vs table) */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/60">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'chart'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Chart
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table
            </button>
          </div>

          {/* Chart Type Selector */}
          {viewMode === 'chart' && (
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/60">
              <button
                onClick={() => setChartType('bar')}
                title="Bar Chart"
                className={`p-1.5 rounded-md transition-colors ${
                  chartType === 'bar'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('line')}
                title="Line Chart"
                className={`p-1.5 rounded-md transition-colors ${
                  chartType === 'line'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LineChartIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('area')}
                title="Area Chart"
                className={`p-1.5 rounded-md transition-colors ${
                  chartType === 'area'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AreaChartIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('pie')}
                title="Pie Chart"
                className={`p-1.5 rounded-md transition-colors ${
                  chartType === 'pie'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PieChartIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Export CSV button */}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Axis & Dimension Selectors */}
      {viewMode === 'chart' && (
        <div className="flex flex-wrap items-center gap-4 py-3 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">X-Axis (Dimension):</span>
            <select
              value={xKey}
              onChange={(e) => setXKey(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Y-Axis (Metric):</span>
            <select
              value={yKey}
              onChange={(e) => setYKey(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Metric Quick Stats */}
      {stats && viewMode === 'chart' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Sum</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {stats.sum.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Average</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {stats.avg.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Maximum</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {stats.max.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Records</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {stats.count.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Main Content: Chart or Table */}
      <div className="mt-3">
        {viewMode === 'chart' ? (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="_label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={chartData.length > 15 ? Math.floor(chartData.length / 10) : 0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.92)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey={yKey} fill="#4f46e5" radius={[4, 4, 0, 0]} name={yKey} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="_label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={chartData.length > 15 ? Math.floor(chartData.length / 10) : 0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.92)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey={yKey}
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    name={yKey}
                  />
                </LineChart>
              ) : chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="_label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={chartData.length > 15 ? Math.floor(chartData.length / 10) : 0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.92)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey={yKey}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                    name={yKey}
                  />
                </AreaChart>
              ) : (
                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.92)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Pie
                    data={chartData.slice(0, 10)}
                    dataKey={yKey}
                    nameKey="_label"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={35}
                    paddingAngle={3}
                  >
                    {chartData.slice(0, 10).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 px-3 w-10">#</th>
                  {columns.map((c) => (
                    <th key={c} className="py-2 px-3 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-1.5 px-3 text-slate-400 font-mono text-[10px]">
                      {idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="py-1.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        {row[col] !== null && row[col] !== undefined
                          ? typeof row[col] === 'number'
                            ? (row[col] % 1 !== 0 ? Number(row[col].toFixed(2)).toLocaleString() : row[col].toLocaleString())
                            : String(row[col])
                          : <span className="text-slate-300 dark:text-slate-600 italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
