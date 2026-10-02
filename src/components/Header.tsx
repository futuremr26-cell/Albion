import React from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Database,
  BarChart2,
  Code2,
  FileText,
  MessageSquareText,
  FileSpreadsheet,
  CheckCircle2,
  RotateCcw,
  LayoutDashboard,
} from 'lucide-react';
import { SAMPLE_PROJECTS, SampleProject } from '../utils/sampleData';

export type StepKey = 'setup' | 'upload' | 'kpis' | 'sql' | 'dashboard';

interface HeaderProps {
  currentStep: StepKey;
  onSelectStep: (step: StepKey) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  hasData: boolean;
  hasKpis: boolean;
  onLoadSample: (sample: SampleProject) => void;
  kpiCount: number;
  onOpenSupabase: () => void;
  onOpenReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  isDark,
  onToggleTheme,
  isChatOpen,
  onToggleChat,
  hasData,
  hasKpis,
  onLoadSample,
  kpiCount,
  onOpenSupabase,
  onOpenReset,
}) => {
  const [sampleMenuOpen, setSampleMenuOpen] = React.useState(false);

  const steps: { key: StepKey; label: string; icon: React.ElementType; completed: boolean }[] = [
    { key: 'setup', label: '1. Setup', icon: FileText, completed: true },
    { key: 'upload', label: '2. Upload & Profile', icon: Database, completed: hasData },
    { key: 'kpis', label: '3. KPIs', icon: BarChart2, completed: hasKpis },
    { key: 'sql', label: '4. SQL & Visuals', icon: Code2, completed: false },
    { key: 'dashboard', label: '5. Dashboard', icon: LayoutDashboard, completed: false },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  InsightBot
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                  AI Analytics Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Problem → Dataset Profile → KPIs → In-Browser SQL &amp; Charts
              </p>
            </div>
          </div>

          {/* Stepper Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = currentStep === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => onSelectStep(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                  {s.completed && s.key !== currentStep && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  )}
                  {s.key === 'kpis' && kpiCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                      {kpiCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2">
            {/* Supabase Cloud Sync */}
            <button
              onClick={onOpenSupabase}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs"
              title="Supabase Cloud Database (Google AI Studio Test)"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Supabase</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            {/* Reset & Delete Data Interface */}
            <button
              onClick={onOpenReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 transition-colors"
              title="Reset workspace or delete data"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Quick Sample Loader */}
            <div className="relative">
              <button
                onClick={() => setSampleMenuOpen(!sampleMenuOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                title="Load a demo dataset and business problem"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Try Sample</span>
              </button>

              {sampleMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSampleMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Pre-loaded Business Scenarios
                    </div>
                    {SAMPLE_PROJECTS.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          onLoadSample(project);
                          setSampleMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {project.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {project.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dark/Light toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* AI Chat Assistant Toggle */}
            <button
              onClick={onToggleChat}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isChatOpen
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span className="hidden sm:inline">AI Chat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.key;
            return (
              <button
                key={s.key}
                onClick={() => onSelectStep(s.key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label.split('. ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
