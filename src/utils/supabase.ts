import { createClient } from '@supabase/supabase-js';

export const SUPABASE_CONFIG = {
  projectName: 'Google AI Studio Test',
  projectId: 'njityjdscgrwnzfhvckm',
  url: 'https://njityjdscgrwnzfhvckm.supabase.co',
  anonKey: 'sb_publishable_toLR3BqlLnf8VUA5gYobJA_vrY22z-Q',
};

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

export interface SupabaseProjectRecord {
  id?: string;
  name: string;
  business_problem: string;
  objectives: string;
  file_name?: string;
  row_count?: number;
  column_count?: number;
  columns?: any;
  preview_rows?: any;
  all_data?: any;
  kpis?: any;
  sql_queries?: any;
  chat_messages?: any;
  created_at?: string;
  updated_at?: string;
}

export const SUPABASE_DDL_SQL = `-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/njityjdscgrwnzfhvckm/sql/new

CREATE TABLE IF NOT EXISTS insightbot_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_problem TEXT,
  objectives TEXT,
  file_name TEXT,
  row_count INT DEFAULT 0,
  column_count INT DEFAULT 0,
  columns JSONB DEFAULT '[]'::jsonb,
  preview_rows JSONB DEFAULT '[]'::jsonb,
  all_data JSONB DEFAULT '[]'::jsonb,
  kpis JSONB DEFAULT '[]'::jsonb,
  sql_queries JSONB DEFAULT '{}'::jsonb,
  chat_messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security and allow public read/write for this app
ALTER TABLE insightbot_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write" 
ON insightbot_projects 
FOR ALL 
USING (true) 
WITH CHECK (true);
`;
