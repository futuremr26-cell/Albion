import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { SUPABASE_CONFIG } from '../utils/supabase';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetActiveWorkspace: () => void;
  onUnloadDatasetOnly: () => void;
  onPurgeAllSupabaseData: () => Promise<void>;
  onFullFactoryReset: () => Promise<void>;
  hasData: boolean;
  kpiCount: number;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onResetActiveWorkspace,
  onUnloadDatasetOnly,
  onPurgeAllSupabaseData,
  onFullFactoryReset,
  hasData,
  kpiCount,
}) => {
  const [activeAction, setActiveAction] = useState<
    'choose' | 'confirm-workspace' | 'confirm-supabase' | 'confirm-factory'
  >('choose');
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetWorkspace = () => {
    onResetActiveWorkspace();
    setActionSuccess('Active workspace cleared and reset to initial setup.');
    setTimeout(() => {
      onClose();
      setActiveAction('choose');
      setActionSuccess(null);
    }, 1200);
  };

  const handleUnloadData = () => {
    onUnloadDatasetOnly();
    setActionSuccess('Uploaded dataset and in-memory table removed.');
    setTimeout(() => {
      onClose();
      setActiveAction('choose');
      setActionSuccess(null);
    }, 1200);
  };

  const handlePurgeSupabase = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') return;
    setIsProcessing(true);
    try {
      await onPurgeAllSupabaseData();
      setActionSuccess('All saved projects purged from Supabase and cache.');
      setTimeout(() => {
        onClose();
        setActiveAction('choose');
        setConfirmText('');
        setActionSuccess(null);
      }, 1400);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete Supabase data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFactoryReset = async () => {
    if (confirmText.trim().toUpperCase() !== 'RESET') return;
    setIsProcessing(true);
    try {
      await onFullFactoryReset();
      setActionSuccess('Full factory reset complete. App restored to default state.');
      setTimeout(() => {
        onClose();
        setActiveAction('choose');
        setConfirmText('');
        setActionSuccess(null);
      }, 1400);
    } catch (err: any) {
      alert(err?.message || 'Failed to perform factory reset.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-900">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Reset App &amp; Delete Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clear workspace state, unload datasets, or purge Supabase records
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              setActiveAction('choose');
              setConfirmText('');
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {actionSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {activeAction === 'choose' && (
            <div className="space-y-3">
              {/* Option 1: Reset Active Workspace */}
              <button
                type="button"
                onClick={() => setActiveAction('confirm-workspace')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-start gap-3.5 group"
              >
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Reset Active Workspace
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      Fast Reset
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Clears the current problem statement, objectives, {kpiCount} KPIs, and active queries. Resets stepper to Step 1.
                  </p>
                </div>
              </button>

              {/* Option 2: Unload Dataset Only */}
              {hasData && (
                <button
                  type="button"
                  onClick={handleUnloadData}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-start gap-3.5 group"
                >
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Unload Dataset &amp; In-Memory SQL Table
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                        Data Only
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Removes the loaded file and unbinds table <code className="font-mono">data</code> from AlaSQL, while keeping your business problem &amp; objectives.
                    </p>
                  </div>
                </button>
              )}

              {/* Option 3: Purge Supabase Cloud Records */}
              <button
                type="button"
                onClick={() => setActiveAction('confirm-supabase')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-start gap-3.5 group"
              >
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      Delete Saved Data from Supabase
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">
                      Supabase Purge
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Deletes all stored project rows in <code className="font-mono">insightbot_projects</code> table in Supabase ({SUPABASE_CONFIG.projectName}).
                  </p>
                </div>
              </button>

              {/* Option 4: Full Factory Reset */}
              <button
                type="button"
                onClick={() => setActiveAction('confirm-factory')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-500 hover:bg-red-50/30 dark:hover:bg-red-950/20 transition-all flex items-start gap-3.5 group"
              >
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 shrink-0 mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-red-700 dark:text-red-400">
                      Full Factory Reset
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 px-2 py-0.5 rounded">
                      Total Wipe
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Resets everything: clears active session, wipes chat messages, and purges all Supabase records.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Confirmation: Reset Active Workspace */}
          {activeAction === 'confirm-workspace' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">Confirm Active Workspace Reset</span>
                  This will clear your current problem description, objectives, data profile, and {kpiCount} KPIs. Any project you previously saved to Supabase will remain safe.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAction('choose')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetWorkspace}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                >
                  Yes, Reset Workspace
                </button>
              </div>
            </div>
          )}

          {/* Confirmation: Delete Saved Supabase Data */}
          {activeAction === 'confirm-supabase' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-900 dark:text-red-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">Permanently Delete All Supabase Projects?</span>
                  This action will delete all saved records from table <code className="font-mono">insightbot_projects</code> in Supabase project <strong>{SUPABASE_CONFIG.projectName}</strong>. This cannot be undone.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAction('choose');
                    setConfirmText('');
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePurgeSupabase}
                  disabled={confirmText.trim().toUpperCase() !== 'DELETE' || isProcessing}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Delete All Supabase Data</span>
                </button>
              </div>
            </div>
          )}

          {/* Confirmation: Full Factory Reset */}
          {activeAction === 'confirm-factory' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-900 dark:text-red-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">Execute Full Factory Reset</span>
                  This will completely clear your active workspace, wipe AI chat history, unload datasets, and purge all saved records in Supabase.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Type <span className="font-mono font-bold text-red-600">RESET</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="RESET"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAction('choose');
                    setConfirmText('');
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFactoryReset}
                  disabled={confirmText.trim().toUpperCase() !== 'RESET' || isProcessing}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Wipe All Data &amp; Reset</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
