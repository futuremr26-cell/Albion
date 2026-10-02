import React from 'react';
import { Target, HelpCircle, ArrowRight, Lightbulb, FileText, Check } from 'lucide-react';
import { SAMPLE_PROJECTS, SampleProject } from '../utils/sampleData';

interface StepSetupProps {
  businessProblem: string;
  setBusinessProblem: (val: string) => void;
  objectives: string;
  setObjectives: (val: string) => void;
  onProceed: () => void;
  onLoadSample: (sample: SampleProject) => void;
}

export const StepSetup: React.FC<StepSetupProps> = ({
  businessProblem,
  setBusinessProblem,
  objectives,
  setObjectives,
  onProceed,
  onLoadSample,
}) => {
  const isFilled = businessProblem.trim().length > 10 && objectives.trim().length > 10;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-cyan-500/10 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Target className="w-3.5 h-3.5" />
            Step 1: Strategic Foundations
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Define the Business Problem &amp; Objectives
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            InsightBot analyzes your goals alongside your uploaded dataset schema to formulate high-impact KPIs, write validated SQL queries, and deliver strategic recommendations.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="mt-6 pt-5 border-t border-indigo-100/80 dark:border-indigo-900/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Need inspiration? Load an end-to-end sample problem:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROJECTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => onLoadSample(sample)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 shadow-2xs transition-all"
              >
                <span>{sample.name.split(':')[0]}</span>
                <span className="text-[10px] text-indigo-500">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Business Problem */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="businessProblem"
              className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"
            >
              <FileText className="w-4 h-4 text-indigo-500" />
              1. Business Problem
              <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-400">
              {businessProblem.length} characters
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Describe the root friction, operational issue, churn risk, or revenue bottleneck you need to investigate.
          </p>
          <textarea
            id="businessProblem"
            rows={4}
            value={businessProblem}
            onChange={(e) => setBusinessProblem(e.target.value)}
            placeholder="e.g., Despite a 25% revenue surge last quarter, operating profit margins shrunk from 18% to 11%. We suspect customer return rates and steep promo discounting in apparel are causing negative contribution margins..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Project Objectives */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="projectObjectives"
              className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"
            >
              <Target className="w-4 h-4 text-indigo-500" />
              2. Key Project Objectives
              <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-400">
              {objectives.length} characters
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            List specific outcomes, metric targets, or decisions this data project must unlock (bullet points recommended).
          </p>
          <textarea
            id="projectObjectives"
            rows={4}
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="- Calculate net profit margin after discounts and refunds by product category.&#10;- Identify customer segments with return rates above 20%.&#10;- Pinpoint the discount threshold where orders become net unprofitable."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
          />
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>You can adjust these objectives anytime to re-steer AI KPI generation.</span>
          </div>

          <button
            type="button"
            onClick={onProceed}
            disabled={!isFilled}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all ${
              isFilled
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-indigo-500/25 shadow-md'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Proceed to Data Upload</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
