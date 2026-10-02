import React, { useState, useEffect } from 'react';
import { Header, StepKey } from './components/Header';
import { StepSetup } from './components/StepSetup';
import { StepUpload } from './components/StepUpload';
import { StepKPIs } from './components/StepKPIs';
import { StepSqlStudio } from './components/StepSqlStudio';
import { StepDashboard } from './components/StepDashboard';
import { ChatDrawer } from './components/ChatDrawer';
import { SupabaseModal } from './components/SupabaseModal';
import { ResetModal } from './components/ResetModal';
import { DataProfile, KPIItem } from './types';
import { SAMPLE_PROJECTS, SampleProject } from './utils/sampleData';
import { profileDataset } from './utils/dataEngine';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('insightbot_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('insightbot_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('insightbot_theme', 'light');
    }
  }, [isDark]);

  // Stepper state
  const [currentStep, setCurrentStep] = useState<StepKey>('setup');

  // Business context
  const [businessProblem, setBusinessProblem] = useState<string>(SAMPLE_PROJECTS[0].businessProblem);
  const [objectives, setObjectives] = useState<string>(SAMPLE_PROJECTS[0].objectives);

  // Data Profile
  const [dataProfile, setDataProfile] = useState<DataProfile | null>(() => {
    // Pre-profile first sample dataset so user has an immediate playground!
    const sample = SAMPLE_PROJECTS[0];
    return profileDataset(sample.data, sample.fileName, 3200);
  });

  // KPIs
  const [kpis, setKpis] = useState<KPIItem[]>([
    {
      id: 'kpi-1',
      name: 'Net Profit Margin %',
      definition: 'Percentage of revenue remaining after subtracting COGS, discounts, and shipping expenses.',
      formula: 'SUM(gross_revenue - cogs - shipping_cost) / SUM(gross_revenue) * 100',
      columns_used: ['gross_revenue', 'cogs', 'shipping_cost'],
      why_it_matters: 'Reveals true operational profitability and pinpoints where promo discounts turn margins negative.',
      category: 'Profitability',
      targetDirection: 'higher',
    },
    {
      id: 'kpi-2',
      name: 'Product Return Rate %',
      definition: 'Percentage of orders returned by customer category or region.',
      formula: 'COUNT(CASE WHEN returned = "Yes" THEN 1 END) / COUNT(order_id) * 100',
      columns_used: ['returned', 'order_id', 'category'],
      why_it_matters: 'High return rates erode margins due to reverse logistics and restock depreciation.',
      category: 'Operations',
      targetDirection: 'lower',
    },
    {
      id: 'kpi-3',
      name: 'Discount Erosion Factor',
      definition: 'Ratio of total dollar discounts granted relative to gross revenue.',
      formula: 'SUM(unit_price * quantity * discount_pct) / SUM(unit_price * quantity)',
      columns_used: ['unit_price', 'quantity', 'discount_pct'],
      why_it_matters: 'Identifies categories suffering from discount addiction and margin compression.',
      category: 'Profitability',
      targetDirection: 'lower',
    },
    {
      id: 'kpi-4',
      name: 'Category Contribution Margin',
      definition: 'Dollar contribution per merchandise category after direct costs.',
      formula: 'SUM(gross_revenue - cogs - shipping_cost)',
      columns_used: ['category', 'gross_revenue', 'cogs', 'shipping_cost'],
      why_it_matters: 'Guides inventory restocking and marketing spend towards high-margin categories.',
      category: 'Growth',
      targetDirection: 'higher',
    },
  ]);

  const [selectedKpi, setSelectedKpi] = useState<KPIItem | null>(null);
  const [isLoadingKpis, setIsLoadingKpis] = useState(false);
  const [kpiError, setKpiError] = useState<string | null>(null);

  // Chat Drawer & Recent Query context
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [recentQuery, setRecentQuery] = useState<{
    sql: string;
    status: string;
    rowCount: number;
  } | null>(null);

  // Reset Active Workspace
  const handleResetActiveWorkspace = () => {
    setBusinessProblem('');
    setObjectives('');
    setDataProfile(null);
    setKpis([]);
    setSelectedKpi(null);
    setRecentQuery(null);
    setCurrentStep('setup');
  };

  // Unload Dataset Only
  const handleUnloadDatasetOnly = () => {
    setDataProfile(null);
    setKpis([]);
    setSelectedKpi(null);
    setRecentQuery(null);
    setCurrentStep('upload');
  };

  // Purge All Supabase Projects
  const handlePurgeAllSupabaseData = async () => {
    const res = await fetch('/api/supabase/projects', { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to purge Supabase data');
    }
  };

  // Full Factory Reset
  const handleFullFactoryReset = async () => {
    await handlePurgeAllSupabaseData();
    handleResetActiveWorkspace();
  };

  // Load a project from Supabase
  const handleLoadSupabaseProject = (project: any) => {
    if (project.business_problem) setBusinessProblem(project.business_problem);
    if (project.objectives) setObjectives(project.objectives);
    if (project.all_data && project.all_data.length > 0) {
      const profile = profileDataset(project.all_data, project.file_name || 'dataset.csv', 3000);
      setDataProfile(profile);
    }
    if (Array.isArray(project.kpis) && project.kpis.length > 0) {
      setKpis(project.kpis);
      setSelectedKpi(project.kpis[0]);
      setCurrentStep('kpis');
    } else {
      setCurrentStep('upload');
    }
  };

  // Load a sample scenario
  const handleLoadSample = (sample: SampleProject) => {
    setBusinessProblem(sample.businessProblem);
    setObjectives(sample.objectives);
    const profile = profileDataset(sample.data, sample.fileName, 3400);
    setDataProfile(profile);
    setKpis([]);
    setSelectedKpi(null);
    setCurrentStep('upload');
  };

  // Identify KPIs with Gemini API
  const handleIdentifyKpis = async () => {
    if (!dataProfile || dataProfile.rowCount === 0) {
      setKpiError('Please upload a dataset first so schema and sample rows can be analyzed.');
      return;
    }

    setIsLoadingKpis(true);
    setKpiError(null);

    try {
      const res = await fetch('/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProblem:
            businessProblem?.trim() ||
            `Analyze ${dataProfile.fileName || 'dataset'} to identify performance drivers, volume scale, and category variations.`,
          objectives:
            objectives?.trim() ||
            'Formulate key metrics to evaluate profitability, track distributions, and compute efficiency rates.',
          schema: dataProfile.columns,
          sampleRows: dataProfile.previewRows.slice(0, 5),
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.kpis) {
        throw new Error(data.error || 'Failed to identify KPIs.');
      }

      let rawList: any[] = [];
      if (Array.isArray(data.kpis)) {
        rawList = data.kpis;
      } else if (data.kpis && typeof data.kpis === 'object') {
        if (Array.isArray(data.kpis.kpis)) rawList = data.kpis.kpis;
        else if (Array.isArray(data.kpis.metrics)) rawList = data.kpis.metrics;
        else if (Array.isArray(data.kpis.items)) rawList = data.kpis.items;
        else {
          rawList = Object.values(data.kpis).filter(
            (v: any) => typeof v === 'object' && v !== null && (v.name || v.formula)
          );
        }
      }

      if (rawList.length === 0) {
        throw new Error('No KPI items were generated. Please try again.');
      }

      const items: KPIItem[] = rawList.map((k: any, idx: number) => ({
        id: `kpi-${Date.now()}-${idx}`,
        name: k.name || `KPI ${idx + 1}`,
        definition: k.definition || '',
        formula: k.formula || '',
        columns_used: Array.isArray(k.columns_used) ? k.columns_used : [],
        why_it_matters: k.why_it_matters || '',
        category: k.category || 'Performance',
        targetDirection: k.targetDirection || 'higher',
      }));

      setKpis(items);
      if (items.length > 0) {
        setSelectedKpi(items[0]);
      }
    } catch (err: any) {
      console.error('Failed to generate KPIs:', err);
      setKpiError(err?.message || 'Error communicating with AI service. Try clicking Identify KPIs again.');
    } finally {
      setIsLoadingKpis(false);
    }
  };

  // Select KPI and jump to SQL step
  const handleSelectKpiForSql = (kpi: KPIItem) => {
    setSelectedKpi(kpi);
    setCurrentStep('sql');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Application Bar */}
      <Header
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        hasData={dataProfile !== null && dataProfile.rowCount > 0}
        hasKpis={kpis.length > 0}
        onLoadSample={handleLoadSample}
        kpiCount={kpis.length}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
        onOpenReset={() => setIsResetOpen(true)}
      />

      {/* Main Stepper Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'setup' && (
          <StepSetup
            businessProblem={businessProblem}
            setBusinessProblem={setBusinessProblem}
            objectives={objectives}
            setObjectives={setObjectives}
            onProceed={() => setCurrentStep('upload')}
            onLoadSample={handleLoadSample}
          />
        )}

        {currentStep === 'upload' && (
          <StepUpload
            dataProfile={dataProfile}
            setDataProfile={setDataProfile}
            onProceedToKpis={() => setCurrentStep('kpis')}
            onLoadSample={() => handleLoadSample(SAMPLE_PROJECTS[0])}
            onOpenSupabase={() => setIsSupabaseOpen(true)}
            onUnloadDataset={handleUnloadDatasetOnly}
            onProceedToDashboard={() => setCurrentStep('dashboard')}
          />
        )}

        {currentStep === 'kpis' && (
          <StepKPIs
            businessProblem={businessProblem}
            objectives={objectives}
            dataProfile={dataProfile}
            kpis={kpis}
            onIdentifyKpis={handleIdentifyKpis}
            isLoadingKpis={isLoadingKpis}
            onSelectKpiForSql={handleSelectKpiForSql}
            onGoToUpload={() => setCurrentStep('upload')}
            kpiError={kpiError}
          />
        )}

        {currentStep === 'sql' && (
          <StepSqlStudio
            dataProfile={dataProfile}
            kpis={kpis}
            selectedKpi={selectedKpi}
            onSelectKpi={setSelectedKpi}
            businessProblem={businessProblem}
            objectives={objectives}
            onKpiExecuted={(_id, queryInfo) => setRecentQuery(queryInfo)}
            onProceedToDashboard={() => setCurrentStep('dashboard')}
          />
        )}

        {currentStep === 'dashboard' && (
          <StepDashboard
            dataProfile={dataProfile}
            businessProblem={businessProblem}
            objectives={objectives}
            kpis={kpis}
            onGoToUpload={() => setCurrentStep('upload')}
            onOpenSupabase={() => setIsSupabaseOpen(true)}
          />
        )}
      </main>

      {/* Side Chat Assistant Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        businessProblem={businessProblem}
        objectives={objectives}
        dataProfile={dataProfile}
        kpis={kpis}
        recentQuery={recentQuery}
        onRunSqlInStudio={(sql) => {
          setCurrentStep('sql');
        }}
      />

      {/* Supabase Cloud Sync Modal */}
      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        businessProblem={businessProblem}
        objectives={objectives}
        dataProfile={dataProfile}
        kpis={kpis}
        onLoadProject={handleLoadSupabaseProject}
      />

      {/* Reset & Delete Data Modal */}
      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onResetActiveWorkspace={handleResetActiveWorkspace}
        onUnloadDatasetOnly={handleUnloadDatasetOnly}
        onPurgeAllSupabaseData={handlePurgeAllSupabaseData}
        onFullFactoryReset={handleFullFactoryReset}
        hasData={dataProfile !== null && dataProfile.rowCount > 0}
        kpiCount={kpis.length}
      />
    </div>
  );
}
