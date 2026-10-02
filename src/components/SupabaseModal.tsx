import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Download,
  FolderOpen,
  Save,
  RefreshCw,
  Server,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { SUPABASE_CONFIG, SUPABASE_DDL_SQL } from '../utils/supabase';
import { DataProfile, KPIItem } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessProblem: string;
  objectives: string;
  dataProfile: DataProfile | null;
  kpis: KPIItem[];
  onLoadProject: (project: any) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  businessProblem,
  objectives,
  dataProfile,
  kpis,
  onLoadProject,
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'schema'>('save');
  const [projectName, setProjectName] = useState(
    dataProfile?.fileName
      ? `Analysis of ${dataProfile.fileName.replace(/\.[^/.]+$/, '')}`
      : 'E-Commerce Profitability Analysis'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected?: boolean;
    tableExists?: boolean;
  } | null>(null);

  // Check Supabase connection on open
  useEffect(() => {
    if (isOpen) {
      checkStatus();
      fetchProjects();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setConnectionStatus(data);
    } catch (err) {
      console.error('Failed to check Supabase status:', err);
    }
  };

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch('/api/supabase/projects');
      const data = await res.json();
      setProjectsList(data.projects || []);
    } catch (err) {
      console.error('Error fetching Supabase projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}" from Supabase?`)) return;
    try {
      const res = await fetch(`/api/supabase/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      fetchProjects();
    } catch (err: any) {
      alert(err?.message || 'Error deleting project');
    }
  };

  const handleSaveToSupabase = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch('/api/supabase/save-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          businessProblem,
          objectives,
          fileName: dataProfile?.fileName || 'dataset.csv',
          rowCount: dataProfile?.rowCount || 0,
          columnCount: dataProfile?.columnCount || 0,
          columns: dataProfile?.columns || [],
          previewRows: dataProfile?.previewRows || [],
          allData: dataProfile?.allData || [],
          kpis,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setSaveStatus({
        success: true,
        message: data.message || 'Saved successfully to Supabase!',
      });
      fetchProjects();
    } catch (err: any) {
      setSaveStatus({
        success: false,
        message: err?.message || 'Error saving to Supabase.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_DDL_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Supabase Cloud Database
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Project: <span className="font-semibold text-slate-700 dark:text-slate-300">{SUPABASE_CONFIG.projectName}</span> ({SUPABASE_CONFIG.projectId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Credentials Info Strip */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 font-mono text-slate-600 dark:text-slate-300">
            <span>
              URL: <strong className="text-indigo-600 dark:text-indigo-400">{SUPABASE_CONFIG.url}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>
              Key: <strong className="text-slate-700 dark:text-slate-200">{SUPABASE_CONFIG.anonKey.slice(0, 16)}...</strong>
            </span>
          </div>

          <a
            href={`https://supabase.com/dashboard/project/${SUPABASE_CONFIG.projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('save')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'save'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save Active Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('load')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'load'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Saved Projects ({projectsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>SQL Schema Setup</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'save' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  Project / Analysis Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Q3 Sales & Churn Deep Dive"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Payload Summary Preview */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Summary of Data to be Persisted:
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div>• Business Problem: <strong className="text-slate-800 dark:text-slate-200">{businessProblem.slice(0, 30)}...</strong></div>
                  <div>• Objectives: <strong className="text-slate-800 dark:text-slate-200">{objectives.slice(0, 30)}...</strong></div>
                  <div>• Dataset: <strong className="text-slate-800 dark:text-slate-200">{dataProfile?.rowCount || 0} rows</strong> ({dataProfile?.fileName || 'None'})</div>
                  <div>• KPIs Identified: <strong className="text-slate-800 dark:text-slate-200">{kpis.length} metrics</strong></div>
                </div>
              </div>

              {saveStatus && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                    saveStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {saveStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  )}
                  <span>{saveStatus.message}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveToSupabase}
                  disabled={isSaving || !projectName.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save to Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'load' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Select a previously stored project to load into your active session:
                </span>
                <button
                  onClick={fetchProjects}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              {isLoadingProjects ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-indigo-500" />
                  Loading projects from Supabase...
                </div>
              ) : projectsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No projects saved in Supabase yet. Save your active project in the "Save" tab!
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {projectsList.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <span>File: {p.file_name || 'N/A'}</span>
                          <span>•</span>
                          <span>{p.row_count || 0} rows</span>
                          <span>•</span>
                          <span>{(p.kpis || []).length} KPIs</span>
                          <span>•</span>
                          <span>{new Date(p.updated_at || p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onLoadProject(p);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Load</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id, p.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 transition-colors"
                          title="Delete from Supabase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    PostgreSQL Table Schema (insightbot_projects)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Execute this query once in your Supabase SQL editor to create the projects table.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://supabase.com/dashboard/project/${SUPABASE_CONFIG.projectId}/sql/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    <span>Open Supabase SQL Editor</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 overflow-x-auto">
                <pre className="font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap">
                  {SUPABASE_DDL_SQL}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
