import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://njityjdscgrwnzfhvckm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_toLR3BqlLnf8VUA5gYobJA_vrY22z-Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// In-memory fallback in case the remote Supabase table has not been created in the user's dashboard yet
let inMemoryProjectsFallback: any[] = [];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to extract JSON from model output
function extractJsonFromText(text: string): any {
  if (!text) return null;
  const trimmed = text.trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Parse inside ```json ... ``` or ``` ... ```
  const markdownMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    try {
      return JSON.parse(markdownMatch[1].trim());
    } catch {}
  }

  // 3. Scan for outer JSON array [ ... ]
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(trimmed.substring(firstBracket, lastBracket + 1));
    } catch {}
  }

  // 4. Scan for outer JSON object { ... }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
    } catch {}
  }

  throw new Error('Unable to parse valid JSON from AI response.');
}

// Resilient Gemini API caller with automatic model fallback & backoff
async function callGeminiWithFallback(params: {
  contents: any;
  config?: any;
  models?: string[];
}): Promise<string> {
  const modelsToTry = params.models || [
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED');

        if (isTransient && attempt === 0) {
          // Exponential backoff
          await new Promise((r) => setTimeout(r, 700));
          continue;
        }
        break; // Proceed to next model candidate
      }
    }
  }

  throw lastError || new Error('All AI models currently busy.');
}

function formatColName(name: string): string {
  if (!name) return 'Metric';
  return name
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Heuristic KPI Synthesizer for uploaded dataset
function generateHeuristicKpis(schema: any[], sampleRows: any[], businessProblem?: string, objectives?: string): any[] {
  const numericCols = (schema || []).filter((c: any) => c.type === 'number').map((c: any) => c.name);
  const stringCols = (schema || []).filter((c: any) => c.type === 'string' || c.type === 'date').map((c: any) => c.name);
  const kpis: any[] = [];

  if (numericCols.length > 0) {
    const primaryNum = numericCols[0];
    kpis.push({
      name: `Total ${formatColName(primaryNum)}`,
      definition: `Aggregated sum of ${primaryNum} across all records in table data.`,
      formula: `SUM(${primaryNum})`,
      columns_used: [primaryNum],
      why_it_matters: `Establishes total baseline volume and scale for primary numerical operations.`,
      category: 'Volume & Scale',
      targetDirection: 'higher',
    });

    kpis.push({
      name: `Average ${formatColName(primaryNum)} per Entry`,
      definition: `Mean magnitude of ${primaryNum} across logged entries.`,
      formula: `AVG(${primaryNum})`,
      columns_used: [primaryNum],
      why_it_matters: `Provides unit-level benchmark to monitor fluctuations and outlier records.`,
      category: 'Efficiency',
      targetDirection: 'higher',
    });

    if (numericCols.length > 1) {
      const secondaryNum = numericCols[1];
      kpis.push({
        name: `${formatColName(primaryNum)} vs ${formatColName(secondaryNum)} Efficiency`,
        definition: `Proportional multiplier comparing ${primaryNum} against ${secondaryNum}.`,
        formula: `SUM(${primaryNum}) / NULLIF(SUM(${secondaryNum}), 0)`,
        columns_used: [primaryNum, secondaryNum],
        why_it_matters: `Measures conversion rate, margin leverage, or yield between key financial/operational drivers.`,
        category: 'Profitability',
        targetDirection: 'higher',
      });
    }

    if (numericCols.length > 2) {
      const tertiaryNum = numericCols[2];
      kpis.push({
        name: `Net ${formatColName(primaryNum)} Contribution`,
        definition: `Net yield subtracting ${tertiaryNum} deductions from ${primaryNum}.`,
        formula: `SUM(${primaryNum} - ${tertiaryNum})`,
        columns_used: [primaryNum, tertiaryNum],
        why_it_matters: `Directly assesses bottom-line retention after direct operational deductions.`,
        category: 'Profitability',
        targetDirection: 'higher',
      });
    }
  }

  if (stringCols.length > 0) {
    const primaryCat = stringCols[0];
    kpis.push({
      name: `${formatColName(primaryCat)} Category Breadth`,
      definition: `Count of unique and distinct active ${primaryCat} categories.`,
      formula: `COUNT(DISTINCT ${primaryCat})`,
      columns_used: [primaryCat],
      why_it_matters: `Monitors segment diversification and flags concentration risk across categories.`,
      category: 'Operations',
      targetDirection: 'neutral',
    });
  }

  kpis.push({
    name: 'Total Event Throughput',
    definition: 'Count of total row events captured in the dataset.',
    formula: 'COUNT(*)',
    columns_used: schema.length > 0 ? [schema[0].name] : [],
    why_it_matters: 'Validates statistical sample significance and aggregate system velocity.',
    category: 'Operations',
    targetDirection: 'higher',
  });

  return kpis;
}

function generateHeuristicSql(kpi: any, dialect: string, schema: any[]): any {
  const numericCols = (schema || []).filter((c: any) => c.type === 'number').map((c: any) => c.name);
  const stringCols = (schema || []).filter((c: any) => c.type === 'string' || c.type === 'date').map((c: any) => c.name);

  const targetCol = kpi?.columns_used?.[0] || numericCols[0] || (schema[0]?.name || 'id');
  const catCol = stringCols[0] || null;

  if (catCol && numericCols.includes(targetCol)) {
    return {
      sql: `SELECT ${catCol}, SUM(${targetCol}) AS total_${targetCol}, COUNT(*) AS record_count FROM data GROUP BY ${catCol} ORDER BY total_${targetCol} DESC`,
      explanation: `Aggregates ${targetCol} grouped by ${catCol} to identify leading performance segments.`,
      dialect: dialect || 'PostgreSQL',
      suggestedChart: {
        type: 'bar',
        xKey: catCol,
        yKey: `total_${targetCol}`,
        title: `${kpi?.name || 'Metric'} by ${formatColName(catCol)}`,
      },
    };
  }

  return {
    sql: `SELECT COUNT(*) AS total_records, SUM(${targetCol}) AS sum_${targetCol}, AVG(${targetCol}) AS avg_${targetCol} FROM data`,
    explanation: `Calculates aggregate volume and metrics directly from table data.`,
    dialect: dialect || 'PostgreSQL',
    suggestedChart: {
      type: 'bar',
      xKey: 'total_records',
      yKey: `sum_${targetCol}`,
      title: `${kpi?.name || 'Metric'} Overview`,
    },
  };
}

// 1. KPI Identification Endpoint
app.post('/api/kpis', async (req: Request, res: Response) => {
  let { businessProblem, objectives, schema, sampleRows } = req.body;

  // Auto-fill defaults if user uploaded dataset without typing business context
  if (!businessProblem || !businessProblem.trim()) {
    businessProblem = 'Analyze the uploaded dataset to discover high-leverage KPIs, growth drivers, and anomalies.';
  }
  if (!objectives || !objectives.trim()) {
    objectives = 'Calculate aggregate metric scale, identify efficiency ratios, and evaluate distributions across categories.';
  }

  schema = Array.isArray(schema) ? schema : [];

  // Sanitize sampleRows (max 5 rows, truncate long strings to keep payload clean)
  const sanitizedSampleRows = (sampleRows || []).slice(0, 5).map((row: any) => {
    const cleanRow: any = {};
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((k) => {
        const val = row[k];
        if (typeof val === 'string' && val.length > 120) {
          cleanRow[k] = val.slice(0, 120) + '...';
        } else {
          cleanRow[k] = val;
        }
      });
    }
    return cleanRow;
  });

  const schemaSummary = schema
    .map(
      (col: any) =>
        `- ${col.name} (type: ${col.type}, nulls: ${col.nullCount || 0}, distinct: ${col.distinctCount || 0}${
          col.min !== undefined ? `, min: ${col.min}, max: ${col.max}` : ''
        })`
    )
    .join('\n');

  const prompt = `You are a Principal Data Strategist and Senior BI Architect.
Based on the following business context, table schema, and sample data rows, identify 4 to 6 high-impact, mathematically sound Key Performance Indicators (KPIs).

BUSINESS PROBLEM:
${businessProblem}

PROJECT OBJECTIVES:
${objectives}

DATASET SCHEMA (Table Name: data):
${schemaSummary || 'No specific schema provided'}

SAMPLE ROWS (5 rows max):
${JSON.stringify(sanitizedSampleRows, null, 2)}

REQUIREMENTS:
1. Every KPI must be directly computable from the columns in table 'data'.
2. Formulas must be mathematically sound (e.g. SUM, AVG, COUNT, ratios, percentage changes).
3. The response must be STRICT JSON array of objects conforming to this structure:
[
  {
    "name": "KPI Name",
    "definition": "Clear, executive-ready explanation of what this measures",
    "formula": "Exact mathematical formula using column names from table 'data'",
    "columns_used": ["col1", "col2"],
    "why_it_matters": "Direct connection to solving the business problem and objectives",
    "category": "Profitability" | "Retention" | "Operations" | "Growth" | "Risk" | "Efficiency",
    "targetDirection": "higher" | "lower" | "neutral"
  }
]
Output valid JSON only with NO markdown wrappers or extraneous commentary.`;

  try {
    const text = await callGeminiWithFallback({
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJsonFromText(text);

    let kpisList: any[] = [];
    if (Array.isArray(parsed)) {
      kpisList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.kpis)) kpisList = parsed.kpis;
      else if (Array.isArray(parsed.metrics)) kpisList = parsed.metrics;
      else if (Array.isArray(parsed.items)) kpisList = parsed.items;
      else {
        kpisList = Object.values(parsed).filter(
          (v: any) => typeof v === 'object' && v !== null && (v.name || v.formula)
        );
      }
    }

    if (kpisList.length > 0) {
      return res.json({ kpis: kpisList, source: 'gemini' });
    }
  } catch (error: any) {
    console.warn('Gemini KPI generation encountered issue, activating heuristic synthesizer:', error?.message);
  }

  // Graceful fallback: Synthesize mathematically valid KPIs directly from schema
  const fallbackKpis = generateHeuristicKpis(schema, sanitizedSampleRows, businessProblem, objectives);
  return res.json({ kpis: fallbackKpis, source: 'heuristic_synthesizer' });
});

// 2. SQL Generation Endpoint
app.post('/api/sql', async (req: Request, res: Response) => {
  const { kpi, dialect, schema, sampleRows, businessProblem, objectives } = req.body;

  if (!kpi) {
    return res.status(400).json({ error: 'KPI details are required.' });
  }

    const targetDialect = dialect || 'PostgreSQL';

    const schemaSummary = (schema || [])
      .map((col: any) => `${col.name} (${col.type})`)
      .join(', ');

    const prompt = `You are a Principal SQL Engineer and Data Visualization Architect.
Generate an executable SQL query in ${targetDialect} dialect to compute the following KPI.

KPI:
- Name: ${kpi.name}
- Definition: ${kpi.definition}
- Formula: ${kpi.formula}
- Target Columns: ${JSON.stringify(kpi.columns_used)}

CONTEXT:
- Business Problem: ${businessProblem || 'N/A'}
- Objectives: ${objectives || 'N/A'}

DATABASE TABLE SPECIFICATION:
- Table name is strictly: data
- Available Columns: ${schemaSummary}
- Sample Rows:
${JSON.stringify(sampleRows?.slice(0, 5) || [], null, 2)}

CRITICAL INSTRUCTIONS:
1. The table name in FROM clause MUST be 'data'.
2. The query will be executed in-browser using AlaSQL / standard SQL parser. Use standard ANSI SQL constructs (SELECT, SUM, AVG, COUNT, CASE WHEN, GROUP BY, ORDER BY, LIMIT) that are fully valid in ${targetDialect} and also compatible with standard in-memory engines.
3. If grouping by date, use standard date string formatting or substring/strftime if supported, or group by existing date/category column.
4. Suggest an optimal chart configuration (type, xKey, yKey) to visualize the result.
5. Provide a clear 1-2 sentence explanation of the query logic.

Return a STRICT JSON object in this format:
{
  "sql": "SELECT category, SUM(gross_revenue) AS total_revenue FROM data GROUP BY category ORDER BY total_revenue DESC",
  "explanation": "Summarizes gross revenue aggregated by category to identify core revenue drivers.",
  "dialect": "${targetDialect}",
  "suggestedChart": {
    "type": "bar",
    "xKey": "category",
    "yKey": "total_revenue",
    "title": "${kpi.name} by Category"
  }
}`;

  try {
    const text = await callGeminiWithFallback({
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJsonFromText(text);
    if (parsed && parsed.sql) {
      return res.json(parsed);
    }
  } catch (error: any) {
    console.warn('Gemini SQL generation error, using heuristic fallback:', error?.message);
  }

  // Graceful fallback for SQL query
  const fallback = generateHeuristicSql(kpi, targetDialect, schema);
  return res.json(fallback);
});

// 3. Fix SQL Endpoint
app.post('/api/fix-sql', async (req: Request, res: Response) => {
  const { kpi, sql, error, dialect, schema, sampleRows } = req.body;

  const schemaSummary = (schema || [])
    .map((col: any) => `${col.name} (${col.type})`)
    .join(', ');

  const prompt = `You are an expert SQL troubleshooter.
The user executed a SQL query in an in-memory browser SQL engine (AlaSQL) on table 'data' and it threw an error.

ORIGINAL SQL QUERY:
${sql}

ERROR MESSAGE:
${error}

DIALECT REQUESTED:
${dialect || 'PostgreSQL'}

TABLE NAME: data
AVAILABLE COLUMNS:
${schemaSummary}

SAMPLE DATA:
${JSON.stringify(sampleRows?.slice(0, 5) || [], null, 2)}

KPI GOAL:
${kpi ? `${kpi.name} (${kpi.formula})` : 'Metric calculation'}

TASK:
1. Fix the SQL so it executes cleanly and without error on table 'data' in AlaSQL / standard SQL.
2. Replace dialect-specific functions (e.g. Postgres DATE_TRUNC or BigQuery EXTRACT) with standard AlaSQL-compatible equivalents (or standard GROUP BY / CASE expressions) while preserving the intended analytical insight.
3. Explain what went wrong and how the fix resolves it.
4. Suggest chart config.

Respond with STRICT JSON:
{
  "sql": "FIXED_SQL_QUERY",
  "explanation": "Explain what caused the error and how the corrected query fixes it.",
  "dialect": "${dialect || 'PostgreSQL'}",
  "suggestedChart": {
    "type": "bar",
    "xKey": "column_for_x",
    "yKey": "column_for_y",
    "title": "Corrected Visualization"
  }
}`;

  try {
    const text = await callGeminiWithFallback({
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJsonFromText(text);
    if (parsed && parsed.sql) {
      return res.json(parsed);
    }
  } catch (err: any) {
    console.warn('Gemini Fix SQL error, using fallback:', err?.message);
  }

  // Fallback fixed SQL
  const fixedFallback = generateHeuristicSql(kpi, dialect, schema);
  fixedFallback.explanation = 'Simplified query using standard aggregate clauses compatible with in-memory execution.';
  return res.json(fixedFallback);
});

// Heuristic Dashboard Synthesizer
function generateHeuristicDashboard(
  schema: any[],
  sampleRows: any[],
  kpis: any[],
  businessProblem?: string
): any {
  const numericCols = (schema || []).filter((c: any) => c.type === 'number').map((c: any) => c.name);
  const stringCols = (schema || []).filter((c: any) => c.type === 'string' || c.type === 'date').map((c: any) => c.name);

  const num1 = numericCols[0] || null;
  const num2 = numericCols[1] || null;
  const cat1 = stringCols[0] || null;
  const cat2 = stringCols[1] || null;

  const widgets: any[] = [];

  // Metric 1: Primary Numeric Sum
  if (num1) {
    widgets.push({
      id: `w-metric-1-${Date.now()}`,
      title: `Total ${formatColName(num1)}`,
      type: 'metric',
      description: `Cumulative sum of ${num1} across all records`,
      sql: `SELECT SUM(${num1}) AS metric_val FROM data`,
      metricLabel: `Total ${formatColName(num1)}`,
      trendSubtext: 'Aggregate Scale Indicator',
      trendDirection: 'up',
      width: 'third',
    });

    // Metric 2: Primary Numeric Avg
    widgets.push({
      id: `w-metric-2-${Date.now()}`,
      title: `Average ${formatColName(num1)}`,
      type: 'metric',
      description: `Mean ${num1} per transaction/record`,
      sql: `SELECT AVG(${num1}) AS metric_val FROM data`,
      metricLabel: `Avg ${formatColName(num1)}`,
      trendSubtext: 'Unit Benchmark',
      trendDirection: 'neutral',
      width: 'third',
    });
  }

  // Metric 3: Secondary metric or Row count
  if (num2) {
    widgets.push({
      id: `w-metric-3-${Date.now()}`,
      title: `Total ${formatColName(num2)}`,
      type: 'metric',
      description: `Cumulative ${num2} volume`,
      sql: `SELECT SUM(${num2}) AS metric_val FROM data`,
      metricLabel: `Total ${formatColName(num2)}`,
      trendSubtext: 'Secondary Driver',
      trendDirection: 'up',
      width: 'third',
    });
  } else {
    widgets.push({
      id: `w-metric-3-${Date.now()}`,
      title: 'Total Records Logged',
      type: 'metric',
      description: 'Total row events captured in dataset',
      sql: 'SELECT COUNT(*) AS metric_val FROM data',
      metricLabel: 'Total Records',
      trendSubtext: 'Data Sample Size',
      trendDirection: 'neutral',
      width: 'third',
    });
  }

  // Chart 1: Bar Chart of num1 grouped by cat1
  if (cat1 && num1) {
    widgets.push({
      id: `w-chart-bar-${Date.now()}`,
      title: `${formatColName(num1)} by ${formatColName(cat1)}`,
      type: 'bar',
      description: `Comparison of total ${num1} across ${cat1} categories`,
      sql: `SELECT ${cat1}, SUM(${num1}) AS total_${num1} FROM data GROUP BY ${cat1} ORDER BY total_${num1} DESC LIMIT 8`,
      xKey: cat1,
      yKey: `total_${num1}`,
      categoryCol: cat1,
      width: 'half',
    });
  }

  // Chart 2: Donut/Pie Chart of Record Count by cat1 (or cat2)
  const targetPieCat = cat2 || cat1;
  if (targetPieCat) {
    widgets.push({
      id: `w-chart-pie-${Date.now()}`,
      title: `Distribution by ${formatColName(targetPieCat)}`,
      type: 'pie',
      description: `Proportional breakdown of entries across ${targetPieCat}`,
      sql: `SELECT ${targetPieCat}, COUNT(*) AS total_count FROM data GROUP BY ${targetPieCat} ORDER BY total_count DESC LIMIT 6`,
      xKey: targetPieCat,
      yKey: 'total_count',
      categoryCol: targetPieCat,
      width: 'half',
    });
  }

  // Chart 3: Area or Line Chart
  if (cat1 && num2) {
    widgets.push({
      id: `w-chart-line-${Date.now()}`,
      title: `${formatColName(num2)} Distribution across ${formatColName(cat1)}`,
      type: 'area',
      description: `Magnitude of ${num2} per ${cat1}`,
      sql: `SELECT ${cat1}, SUM(${num2}) AS total_${num2} FROM data GROUP BY ${cat1} ORDER BY total_${num2} DESC LIMIT 8`,
      xKey: cat1,
      yKey: `total_${num2}`,
      categoryCol: cat1,
      width: 'half',
    });
  } else if (cat1) {
    widgets.push({
      id: `w-chart-line-${Date.now()}`,
      title: `Record Volume by ${formatColName(cat1)}`,
      type: 'line',
      description: `Activity count per ${cat1}`,
      sql: `SELECT ${cat1}, COUNT(*) AS frequency FROM data GROUP BY ${cat1} ORDER BY frequency DESC LIMIT 8`,
      xKey: cat1,
      yKey: 'frequency',
      categoryCol: cat1,
      width: 'half',
    });
  }

  // Breakdown Table widget
  if (cat1 && num1) {
    widgets.push({
      id: `w-table-1-${Date.now()}`,
      title: `${formatColName(cat1)} Performance Matrix`,
      type: 'table',
      description: `Detailed aggregation matrix for each ${cat1}`,
      sql: `SELECT ${cat1}, COUNT(*) AS record_count, SUM(${num1}) AS total_${num1}, ROUND(AVG(${num1}), 2) AS avg_${num1} FROM data GROUP BY ${cat1} ORDER BY total_${num1} DESC LIMIT 10`,
      width: 'full',
    });
  }

  return {
    title: businessProblem ? `Executive Dashboard: ${businessProblem.slice(0, 45)}...` : 'Executive Analytics Dashboard',
    subtitle: 'AI-synthesized operational overview and performance distribution',
    widgets,
    activeFilterColumn: cat1 || undefined,
  };
}

// 4. Executive Dashboard Generation Endpoint
app.post('/api/dashboard', async (req: Request, res: Response) => {
  let { businessProblem, objectives, schema, sampleRows, kpis } = req.body;

  schema = Array.isArray(schema) ? schema : [];
  kpis = Array.isArray(kpis) ? kpis : [];

  const schemaSummary = schema.map((c: any) => `- ${c.name} (${c.type})`).join('\n');
  const sanitizedSampleRows = (sampleRows || []).slice(0, 5);

  const prompt = `You are a Principal BI Architect and Executive Dashboard Designer.
Based on the table schema and data rows below, generate a cohesive Executive Dashboard specification.

BUSINESS CONTEXT:
${businessProblem || 'Analyze business performance and metrics'}
${objectives || 'Track scale, efficiency, and segment performance'}

AVAILABLE TABLE SCHEMA (Table name: 'data'):
${schemaSummary}

SAMPLE ROWS:
${JSON.stringify(sanitizedSampleRows, null, 2)}

REQUIREMENTS:
1. Generate:
   - 3 "metric" widgets (headline KPI cards with SQL like SELECT SUM(...) AS metric_val FROM data)
   - 2 to 3 chart widgets ("bar", "line", "area", "pie") with executable SQL against table 'data'
   - 1 "table" widget (breakdown matrix grouping by a categorical column)
2. Every SQL query MUST be strictly valid in standard ANSI / AlaSQL syntax on table 'data'.
3. Always include xKey and yKey for charts, pointing to column names produced by the SELECT query.
4. Output STRICT JSON conforming to:
{
  "title": "Executive Performance Dashboard",
  "subtitle": "High-level summary of operations and key trends",
  "widgets": [
    {
      "id": "w1",
      "title": "Widget Title",
      "type": "metric" | "bar" | "line" | "area" | "pie" | "table",
      "description": "Brief explanation",
      "sql": "SELECT ... FROM data ...",
      "xKey": "category_col",
      "yKey": "metric_col",
      "metricLabel": "Label for metric card",
      "trendSubtext": "Subtext for metric card",
      "trendDirection": "up" | "down" | "neutral",
      "width": "half" | "third" | "full"
    }
  ]
}
Output valid JSON only.`;

  try {
    const text = await callGeminiWithFallback({
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const parsed = extractJsonFromText(text);
    if (parsed && Array.isArray(parsed.widgets) && parsed.widgets.length > 0) {
      return res.json(parsed);
    }
  } catch (err: any) {
    console.warn('Gemini Dashboard generation warning, using heuristic fallback:', err?.message);
  }

  const fallback = generateHeuristicDashboard(schema, sanitizedSampleRows, kpis, businessProblem);
  return res.json(fallback);
});

// 5. AI Chat Assistant Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;

    const { businessProblem, objectives, schema, sampleRows, kpis, recentQuery } = context || {};

    const schemaSummary = (schema || [])
      .map((c: any) => `${c.name} (${c.type})`)
      .join(', ');

    const kpiSummary = (kpis || [])
      .map((k: any) => `- ${k.name}: ${k.definition} [Formula: ${k.formula}]`)
      .join('\n');

    const systemInstruction = `You are InsightBot AI, an elite Business Intelligence Architect and Strategic Data Scientist.
You are helping the user analyze their uploaded dataset (table name: 'data') to solve their business problem and reach their project objectives.

ACTIVE PROJECT CONTEXT:
Business Problem:
${businessProblem || 'Not specified'}

Project Objectives:
${objectives || 'Not specified'}

Dataset Columns (Table: data):
${schemaSummary || 'None loaded yet'}

Identified KPIs:
${kpiSummary || 'None identified yet'}

Sample Rows (5 rows):
${JSON.stringify((sampleRows || []).slice(0, 5), null, 2)}

${recentQuery ? `Last Run Query & Result Summary:\nSQL: ${recentQuery.sql}\nStatus: ${recentQuery.status}\nRows returned: ${recentQuery.rowCount}` : ''}

CAPABILITIES & GUIDELINES:
1. Answer strategic questions, explain data distributions, and diagnose root causes for the business problem.
2. Whenever recommending an analytical query, write it against table 'data' inside standard markdown SQL code blocks (\`\`\`sql ... \`\`\`).
3. Make SQL queries standard and AlaSQL-executable.
4. Recommend next steps, cohort analyses, or metric thresholds to monitor.
5. Keep answers crisp, structured, engaging, and directly grounded in the dataset schema.`;

    const contents: any[] = [];

    // Add conversation history if available
    if (Array.isArray(history)) {
      history.slice(-8).forEach((h: any) => {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      });
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const responseText = await callGeminiWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return res.json({ response: responseText || '' });
  } catch (error: any) {
    console.error('Error in chat assistant:', error);
    return res.status(500).json({
      error: error?.message || 'Chat assistant encountered an error.',
    });
  }
});

// 5. Supabase Integration Endpoints
app.get('/api/supabase/status', async (_req: Request, res: Response) => {
  try {
    // Test connectivity to Supabase
    const { data, error } = await supabase.from('insightbot_projects').select('id').limit(1);
    
    let tableExists = true;
    let tableError = null;

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST205') {
        tableExists = false;
        tableError = error.message;
      }
    }

    return res.json({
      connected: true,
      projectName: 'Google AI Studio Test',
      projectId: 'njityjdscgrwnzfhvckm',
      url: SUPABASE_URL,
      tableExists,
      tableError,
      fallbackProjectCount: inMemoryProjectsFallback.length,
    });
  } catch (err: any) {
    return res.json({
      connected: false,
      projectName: 'Google AI Studio Test',
      projectId: 'njityjdscgrwnzfhvckm',
      error: err?.message || 'Failed to reach Supabase API',
    });
  }
});

// Save Project to Supabase
app.post('/api/supabase/save-project', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const projectRecord = {
      name: payload.name || `Project ${new Date().toLocaleDateString()}`,
      business_problem: payload.businessProblem || payload.business_problem || '',
      objectives: payload.objectives || '',
      file_name: payload.fileName || payload.file_name || '',
      row_count: payload.rowCount || payload.row_count || 0,
      column_count: payload.columnCount || payload.column_count || 0,
      columns: payload.columns || [],
      preview_rows: payload.previewRows || payload.preview_rows || [],
      all_data: payload.allData || payload.all_data || [],
      kpis: payload.kpis || [],
      sql_queries: payload.sqlQueries || payload.sql_queries || {},
      chat_messages: payload.chatMessages || payload.chat_messages || [],
      updated_at: new Date().toISOString(),
    };

    // Try saving directly to Supabase table
    const { data, error } = await supabase
      .from('insightbot_projects')
      .insert([projectRecord])
      .select();

    if (!error && data && data.length > 0) {
      return res.json({
        success: true,
        source: 'supabase',
        project: data[0],
        message: 'Successfully persisted project to Supabase table insightbot_projects!',
      });
    }

    // If Supabase table does not exist or RLS blocked, store in fallback cache & notify user
    const fallbackId = `proj-${Date.now()}`;
    const fallbackItem = {
      id: fallbackId,
      ...projectRecord,
      created_at: new Date().toISOString(),
    };
    inMemoryProjectsFallback.unshift(fallbackItem);

    return res.json({
      success: true,
      source: 'local_fallback',
      supabaseError: error?.message || 'Table does not exist yet',
      project: fallbackItem,
      message: 'Saved to local workspace. Run the SQL schema script in your Supabase dashboard to enable remote PostgreSQL storage.',
    });
  } catch (err: any) {
    console.error('Error saving project to Supabase:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to save project',
    });
  }
});

// Get Projects from Supabase
app.get('/api/supabase/projects', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('insightbot_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      // Merge remote and fallback
      const combined = [...data, ...inMemoryProjectsFallback.filter(f => !data.some(d => d.id === f.id))];
      return res.json({
        projects: combined,
        source: 'supabase',
      });
    }

    return res.json({
      projects: inMemoryProjectsFallback,
      source: 'local_fallback',
      supabaseNotice: error?.message || 'Supabase table not found, showing local workspace projects',
    });
  } catch (err: any) {
    return res.json({
      projects: inMemoryProjectsFallback,
      source: 'local_fallback',
    });
  }
});

// Delete a single project from Supabase
app.delete('/api/supabase/projects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Remove from in-memory fallback
    inMemoryProjectsFallback = inMemoryProjectsFallback.filter((p) => p.id !== id);

    // Remove from Supabase table if it exists
    const { error } = await supabase.from('insightbot_projects').delete().eq('id', id);

    if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.warn('Supabase delete warning:', error.message);
    }

    return res.json({
      success: true,
      message: `Project ${id} deleted successfully.`,
    });
  } catch (err: any) {
    console.error('Error deleting project:', err);
    return res.status(500).json({ error: err?.message || 'Failed to delete project' });
  }
});

// Delete ALL projects from Supabase & fallback
app.delete('/api/supabase/projects', async (_req: Request, res: Response) => {
  try {
    inMemoryProjectsFallback = [];

    // Delete all rows in Supabase table
    const { error } = await supabase
      .from('insightbot_projects')
      .delete()
      .neq('name', '___NON_EXISTENT_NAME_TRIGGER_ALL___');

    if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.warn('Supabase delete all warning:', error.message);
    }

    return res.json({
      success: true,
      message: 'All projects purged from Supabase and workspace cache.',
    });
  } catch (err: any) {
    console.error('Error deleting all projects:', err);
    return res.status(500).json({ error: err?.message || 'Failed to delete projects' });
  }
});

// Setup Vite middlewares in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InsightBot server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
