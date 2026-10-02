import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import alasql from 'alasql';
import { ColumnProfile, DataProfile } from '../types';

export function inferType(values: any[]): 'number' | 'string' | 'boolean' | 'date' {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'string';

  let numberCount = 0;
  let booleanCount = 0;
  let dateCount = 0;

  for (const v of nonNull) {
    if (typeof v === 'boolean' || v === 'true' || v === 'false') {
      booleanCount++;
      continue;
    }
    if (typeof v === 'number' && !isNaN(v)) {
      numberCount++;
      continue;
    }
    if (typeof v === 'string') {
      // Check numeric string
      if (/^-?\d+(\.\d+)?$/.test(v.trim())) {
        numberCount++;
        continue;
      }
      // Check date format (e.g. YYYY-MM-DD or MM/DD/YYYY)
      if (
        /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(v.trim()) ||
        /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(v.trim())
      ) {
        const parsed = Date.parse(v);
        if (!isNaN(parsed)) {
          dateCount++;
          continue;
        }
      }
    }
    if (v instanceof Date) {
      dateCount++;
      continue;
    }
  }

  const threshold = nonNull.length * 0.8;
  if (numberCount >= threshold) return 'number';
  if (dateCount >= threshold) return 'date';
  if (booleanCount >= threshold) return 'boolean';
  return 'string';
}

export function profileDataset(
  rows: Record<string, any>[],
  fileName: string,
  fileSize: number
): DataProfile {
  if (!rows || rows.length === 0) {
    return {
      fileName,
      fileSize,
      rowCount: 0,
      columnCount: 0,
      columns: [],
      previewRows: [],
      allData: [],
    };
  }

  // Collect all unique column names
  const columnSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((k) => columnSet.add(k));
  });

  const columns: ColumnProfile[] = Array.from(columnSet).map((colName) => {
    const values = rows.map((r) => r[colName]);
    const nullCount = values.filter((v) => v === null || v === undefined || v === '').length;
    const type = inferType(values);

    const distinctValues = new Set(
      values.filter((v) => v !== null && v !== undefined && v !== '').map((v) => String(v))
    );

    const colProfile: ColumnProfile = {
      name: colName,
      type,
      nullCount,
      distinctCount: distinctValues.size,
      sampleValues: values.slice(0, 5),
    };

    if (type === 'number') {
      const numVals = values
        .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
        .filter((n) => typeof n === 'number' && !isNaN(n));

      if (numVals.length > 0) {
        colProfile.min = Math.min(...numVals);
        colProfile.max = Math.max(...numVals);
        const sum = numVals.reduce((acc, curr) => acc + curr, 0);
        colProfile.mean = Number((sum / numVals.length).toFixed(2));
      }
    }

    return colProfile;
  });

  return {
    fileName,
    fileSize,
    rowCount: rows.length,
    columnCount: columns.length,
    columns,
    previewRows: rows.slice(0, 10),
    allData: rows,
  };
}

export async function parseCsvFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
        } else {
          resolve(results.data as Record<string, any>[]);
        }
      },
      error: (err) => reject(err),
    });
  });
}

export async function parseXlsxFile(file: File): Promise<Record<string, any>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Workbook contains no sheets.');
  }
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
  return jsonData;
}

export async function parseUploadedFile(file: File): Promise<Record<string, any>[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || file.type.includes('csv')) {
    return parseCsvFile(file);
  } else if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    file.type.includes('spreadsheet') ||
    file.type.includes('excel')
  ) {
    return parseXlsxFile(file);
  } else {
    // Default try PapaParse then XLSX fallback
    try {
      return await parseCsvFile(file);
    } catch {
      return await parseXlsxFile(file);
    }
  }
}

/**
 * Execute SQL in browser using alasql on table `data`
 */
export function runSqlWithAlaSql(
  sqlQuery: string,
  tableData: Record<string, any>[]
): {
  success: boolean;
  data?: any[];
  error?: string;
  executionTimeMs: number;
  columns?: string[];
} {
  const startTime = performance.now();
  try {
    if (!sqlQuery || !sqlQuery.trim()) {
      return {
        success: false,
        error: 'Empty SQL query provided.',
        executionTimeMs: 0,
      };
    }

    // Clean up query (remove trailing semicolons or markdown block fences if any)
    let cleanSql = sqlQuery.trim();
    cleanSql = cleanSql.replace(/```(sql)?/gi, '').replace(/```/g, '').trim();

    // Ensure alasql has the in-memory data table
    // Re-assign table data
    (alasql as any).tables = (alasql as any).tables || {};
    (alasql as any).tables.data = {
      data: tableData,
    };

    // Execute query
    const result = (alasql as any)(cleanSql);
    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    if (!result) {
      return {
        success: true,
        data: [],
        executionTimeMs,
        columns: [],
      };
    }

    const rows = Array.isArray(result) ? result : [result];
    const columns = rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null
      ? Object.keys(rows[0])
      : ['result'];

    return {
      success: true,
      data: rows,
      executionTimeMs,
      columns,
    };
  } catch (err: any) {
    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
    return {
      success: false,
      error: err?.message || String(err),
      executionTimeMs,
    };
  }
}
