'use client';

import React, { useState, useMemo } from 'react';
import { AccidentRecord, FilterState, Hotspot, ScenarioState } from '@/types/accidents';
import { runFullAnalyticsPipeline } from '@/lib/analytics';
import { DELHI_OFFICIAL_BLACKSPOTS } from '@/lib/data/officialBlackSpots';
import { Navbar } from '@/components/Navbar';
import { HonestyBanner } from '@/components/HonestyBanner';
import { KPICards } from '@/components/KPICards';
import { FilterBar } from '@/components/FilterBar';
import { WhatIfSimulator } from '@/components/WhatIfSimulator';
import { MapWrapper } from '@/components/Map/MapWrapper';
import { TopHotspotsTable } from '@/components/TopHotspotsTable';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { ValidationTab } from '@/components/ValidationTab';
import { HotspotDetailDrawer } from '@/components/HotspotDetailDrawer';
import { CSVUploadModal } from '@/components/CSVUploadModal';
import { PrintableReportModal } from '@/components/PrintableReportModal';
import { DemoTourModal } from '@/components/DemoTourModal';
import { TimeSliderAnimation } from '@/components/TimeSliderAnimation';
import { DecisionSupportTab } from '@/components/DecisionSupportTab';
import { MultiCityQuickSwitcher } from '@/components/MultiCityQuickSwitcher';
import { generateAccidentDataset } from '@/lib/data/datasetGenerator';
import { NormalizationStats } from '@/lib/data/universalCsvNormalizer';
import {
  Navigation,
  MapPin,
  Filter,
  SlidersHorizontal,
  BarChart2,
  Table,
  ChevronDown,
  ChevronUp,
  X,
  Globe,
} from 'lucide-react';

const emptySubscribe = () => () => {};

export default function Home() {
  // Hydration safety guard via React 19 recommended useSyncExternalStore
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Navigation & Modal States (Directly mapping to 3 Problem Statement Outcomes)
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'planning' | 'validation'>('map');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);
  const [isCustomData, setIsCustomData] = useState(false);
  const [customStats, setCustomStats] = useState<NormalizationStats | null>(null);

  // Selected Entities
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [searchTarget, setSearchTarget] = useState<[number, number] | null>(null);

  // Raw Accident Dataset (seeded with default 3,800+ Delhi records)
  const [records, setRecords] = useState<AccidentRecord[]>(() => generateAccidentDataset());

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    severity: 'all',
    cause: 'all',
    weather: 'all',
    roadType: 'all',
    vehicleType: 'all',
    timeOfDay: 'all',
    minRiskTier: 'all',
    startDate: '',
    endDate: '',
  });

  // Timeline year selector
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Multi-City Filtering state (for datasets containing multiple Indian cities)
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');

  // "What-If" Scenario State
  const [scenario, setScenario] = useState<ScenarioState>({
    timeOfDay: 'night',
    weather: 'winter-fog',
    dayType: 'weekday',
    speedEnforcement: 'normal',
  });

  // Update date filter when timeline year changes
  const handleTimelineYearChange = (year: string) => {
    setSelectedYear(year);
    if (year === 'all') {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    } else {
      setFilters(prev => ({
        ...prev,
        startDate: `${year}-01-01T00:00:00Z`,
        endDate: `${year}-12-31T23:59:59Z`,
      }));
    }
  };

  // Active City Filtering (for Multi-City Datasets)
  const activeRecords = useMemo(() => {
    if (!isCustomData || selectedCityFilter === 'ALL') {
      return records;
    }
    return records.filter(r => r.city === selectedCityFilter);
  }, [records, isCustomData, selectedCityFilter]);

  // Dynamic City Name for UI, KPIs, and Banners
  const currentCityName = useMemo(() => {
    if (!isCustomData || !customStats) return 'Delhi NCR';
    if (selectedCityFilter !== 'ALL') return selectedCityFilter;
    return customStats.detectedCity;
  }, [isCustomData, customStats, selectedCityFilter]);

  const displayCityHeader = useMemo(() => {
    if (currentCityName.includes('+') && currentCityName.length > 35) {
      return selectedCityFilter === 'ALL' ? 'Pan-India Multi-City Network' : selectedCityFilter;
    }
    return currentCityName;
  }, [currentCityName, selectedCityFilter]);

  // Dynamic Bounds for Leaflet Camera Auto-Fit
  const activeBounds = useMemo(() => {
    if (!isCustomData || !customStats) return undefined;
    if (selectedCityFilter !== 'ALL') {
      const citySummary = customStats.availableCities.find(c => c.name === selectedCityFilter);
      if (citySummary) return citySummary.bounds;
    }
    return customStats.bounds;
  }, [isCustomData, customStats, selectedCityFilter]);

  // Run Memoized Full Analytics Pipeline over active records
  const analytics = useMemo(() => {
    return runFullAnalyticsPipeline(activeRecords, filters);
  }, [activeRecords, filters]);

  // Handle Search Suggestion
  const handleSearchSuggestion = (roadName: string) => {
    const matched = analytics.hotspots.find(h =>
      h.name.toLowerCase().includes(roadName.toLowerCase()) ||
      h.roadName.toLowerCase().includes(roadName.toLowerCase())
    );
    if (matched) {
      setSelectedHotspot(matched);
      setSearchTarget([matched.centerLat, matched.centerLng]);
    }
  };

  // Handle CSV Upload Success
  const handleCustomUpload = (customRecords: AccidentRecord[], stats: NormalizationStats) => {
    setRecords(customRecords);
    setCustomStats(stats);
    setIsCustomData(true);
    setSelectedCityFilter('ALL');
    setSelectedHotspot(null);
    setSearchTarget(null);
  };

  // Reset to Default Delhi Dataset
  const handleResetDefault = () => {
    setRecords(generateAccidentDataset());
    setIsCustomData(false);
    setCustomStats(null);
    setSelectedCityFilter('ALL');
    setSelectedHotspot(null);
    setSearchTarget(null);
  };

  // Dynamic Road Corridor Shortcuts for Quick-Jump Filter Pills
  const dynamicRoadShortcuts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of activeRecords) {
      if (r.road_name && r.road_name.length > 2 && !r.road_name.startsWith('Corridor Sector')) {
        counts.set(r.road_name, (counts.get(r.road_name) || 0) + 1);
      }
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(e => e[0]);
    if (sorted.length >= 3) return sorted.slice(0, 7);
    return ['Outer Ring Road', 'Mukundpur', 'Dhaula Kuan', 'ISBT Kashmere Gate', 'Peera Garhi'];
  }, [activeRecords]);

  // Export Ranked Hotspots as CSV
  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Hotspot_Name',
      'Road_Corridor',
      'Lat',
      'Lng',
      'Risk_Score',
      'Risk_Tier',
      'Fatal_Crashes',
      'Grievous_Injuries',
      'Total_Crashes',
      'Total_Casualties',
      'Top_Cause',
      'Recommended_Intervention',
    ];

    const rows = analytics.hotspots.map((h, i) => [
      i + 1,
      `"${h.name.replace(/"/g, '""')}"`,
      `"${h.roadName.replace(/"/g, '""')}"`,
      h.centerLat,
      h.centerLng,
      h.riskScore,
      h.riskTier,
      h.fatalCount,
      h.grievousCount,
      h.totalCrashes,
      h.totalCasualties,
      `"${h.contributingFactors.causes[0]?.label || 'Speeding'}"`,
      `"${h.recommendations[0]?.title || 'Enforcement'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SafeRoute_AI_Delhi_Blackspots_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Focus Top Hotspot
  const handleFocusTopHotspot = () => {
    if (analytics.hotspots.length > 0) {
      const top = analytics.hotspots[0];
      setSelectedHotspot(top);
      setSearchTarget([top.centerLat, top.centerLng]);
      setActiveTab('map');
    }
  };

  // Progressive Disclosure Drawer States (Aggregated On-Demand Controls)
  const [showFilters, setShowFilters] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showKpis, setShowKpis] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showCitySwitcher, setShowCitySwitcher] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.severity !== 'all') count++;
    if (filters.cause !== 'all') count++;
    if (filters.weather !== 'all') count++;
    if (filters.roadType !== 'all') count++;
    if (filters.vehicleType !== 'all') count++;
    if (filters.timeOfDay !== 'all') count++;
    if (filters.minRiskTier !== 'all') count++;
    if (filters.startDate || filters.endDate) count++;
    return count;
  }, [filters]);

  const isScenarioActive = useMemo(() => {
    return (
      scenario.timeOfDay !== 'day' ||
      scenario.weather !== 'clear' ||
      scenario.speedEnforcement !== 'normal'
    );
  }, [scenario]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col" suppressHydrationWarning>
        {/* Brand Header Shell */}
        <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/80 text-blue-400">
                <Navigation className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  SafeRoute <span className="text-blue-400">AI</span>
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700">
                  VisionZero
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Initializing Geospatial Engine...</span>
            </div>
          </div>
        </header>

        {/* Skeleton Dashboard Workspace */}
        <main className="flex-1 mx-auto max-w-7xl w-full p-4 space-y-4">
          <div className="h-12 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse" />
          <div className="h-[540px] rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-center">
            <div className="text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <span className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span>Loading SafeRoute AI Satellite Map & Blackspots...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col" suppressHydrationWarning>
      {/* 1. Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onStartDemoTour={() => setIsDemoTourOpen(true)}
        onExportCSV={handleExportCSV}
        isCustomData={isCustomData}
        totalHotspots={analytics.hotspots.length}
        cityName={currentCityName}
      />

      {/* 2. Honesty Banner */}
      <HonestyBanner
        isCustomData={isCustomData}
        cityName={currentCityName}
        recordCount={activeRecords.length}
        onResetDefault={handleResetDefault}
      />

      {/* 3. Streamlined Sub-header (Single Line) */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 px-4 py-2 text-xs">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-semibold text-white">
              {displayCityHeader} Road Risk Intelligence & Decision Support
            </span>
            <span className="hidden md:inline text-slate-400">
              — {activeRecords.length.toLocaleString()} {isCustomData ? 'custom' : 'historical'} incident records
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400 font-mono">
            <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700/80">
              MoRTH 500m Protocol
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700/80 hidden sm:inline">
              DBSCAN Clustering
            </span>
          </div>
        </div>
      </div>

      {/* 4. Main Dashboard Workspace */}
      <main className="flex-1 mx-auto max-w-7xl w-full p-4 space-y-3">
        {/* EXECUTIVE COMMAND BAR / MODULAR ON-DEMAND CONTROLS */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Left: Summary Metric Chips (Key data visible without opening cards) */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-1 font-semibold text-white border border-slate-700">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <span>{displayCityHeader}</span>
              </span>

              <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                <span className="hidden sm:inline text-slate-500">•</span>
                <span><strong>{activeRecords.length.toLocaleString()}</strong> Crashes</span>
                <span className="text-slate-500">•</span>
                <span className="text-rose-400"><strong>{analytics.kpis.fatalities.toLocaleString()}</strong> Fatal</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400"><strong>{analytics.hotspots.length}</strong> Blackspots</span>
                {analytics.hotspots[0] && (
                  <>
                    <span className="hidden md:inline text-slate-500">•</span>
                    <span className="hidden md:inline text-slate-400 truncate max-w-[240px]">
                      Top: <strong className="text-white">{analytics.hotspots[0].name}</strong> ({analytics.hotspots[0].riskScore}/100)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Toggle Buttons (Aggregated On-Demand Information) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* 1. Multi-City Selector Button */}
              {isCustomData && customStats?.isMultiCity && customStats.availableCities.length > 1 && (
                <button
                  onClick={() => setShowCitySwitcher(prev => !prev)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border ${
                    showCitySwitcher
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
                  }`}
                  title="Switch between detected municipalities in your dataset"
                >
                  <Globe className="h-3 w-3" />
                  <span>Cities ({customStats.availableCities.length})</span>
                  {showCitySwitcher ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}

              {/* 2. Search & Filters Button */}
              <button
                onClick={() => setShowFilters(prev => !prev)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border ${
                  showFilters
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : activeFiltersCount > 0
                    ? 'bg-blue-950/60 text-blue-300 border-blue-600/50'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
                }`}
                title="Search corridor and filter by severity, weather, cause, or vehicle"
              >
                <Filter className="h-3 w-3" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="rounded bg-blue-400 text-slate-950 px-1 text-[10px] font-bold font-mono">
                    {activeFiltersCount}
                  </span>
                )}
                {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {/* 3. What-If Simulator Button */}
              <button
                onClick={() => setShowSimulator(prev => !prev)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border ${
                  showSimulator
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : isScenarioActive
                    ? 'bg-blue-950/60 text-blue-300 border-blue-600/50'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
                }`}
                title="Simulate weather, nighttime lighting, and speed enforcement scenarios"
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span>What-If Simulator</span>
                {isScenarioActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                )}
                {showSimulator ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {/* 4. KPI Metrics Cards Button */}
              <button
                onClick={() => setShowKpis(prev => !prev)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border ${
                  showKpis
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
                }`}
                title="Show 5 comprehensive safety KPI cards"
              >
                <BarChart2 className="h-3 w-3" />
                <span>Metrics</span>
                {showKpis ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {/* 5. Priority Blackspots Table Button */}
              <button
                onClick={() => setShowTable(prev => !prev)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border ${
                  showTable
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
                }`}
                title="Show ranked Top 10 high-risk blackspots table"
              >
                <Table className="h-3 w-3" />
                <span>Ranking Table</span>
                {showTable ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {/* Fast Action: Auto-Focus Top Blackspot */}
              <button
                onClick={handleFocusTopHotspot}
                className="flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1 text-xs text-slate-200 border border-slate-700 transition-colors"
                title="Zoom to highest risk blackspot on map"
              >
                <span>Top Spot</span>
                <Navigation className="h-3 w-3 text-blue-400" />
              </button>
            </div>
          </div>
        </div>

        {/* COLLAPSIBLE DRAWER: Multi-City Quick Switcher */}
        {showCitySwitcher && isCustomData && customStats?.isMultiCity && customStats.availableCities.length > 1 && (
          <div className="relative animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between mb-1 px-1 text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Multi-City Geographic Selector</span>
              <button
                onClick={() => setShowCitySwitcher(false)}
                className="text-slate-400 hover:text-white flex items-center gap-0.5"
              >
                <X className="h-3 w-3" /> <span>Close</span>
              </button>
            </div>
            <MultiCityQuickSwitcher
              availableCities={customStats.availableCities}
              totalRecordsCount={records.length}
              selectedCityFilter={selectedCityFilter}
              onSelectCity={cityName => {
                setSelectedCityFilter(cityName);
                setSelectedHotspot(null);
                setSearchTarget(null);
              }}
              activeRecordsCount={activeRecords.length}
              currentCityName={displayCityHeader}
            />
          </div>
        )}

        {/* COLLAPSIBLE DRAWER: KPI Metrics */}
        {showKpis && (
          <div className="relative animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between mb-1 px-1 text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Macro Safety & Lethality Metrics</span>
              <button
                onClick={() => setShowKpis(false)}
                className="text-slate-400 hover:text-white flex items-center gap-0.5"
              >
                <X className="h-3 w-3" /> <span>Close</span>
              </button>
            </div>
            <KPICards
              kpis={analytics.kpis}
              onFocusTopHotspot={handleFocusTopHotspot}
              cityName={currentCityName}
            />
          </div>
        )}

        {/* COLLAPSIBLE DRAWER: Multi-Variable Filter Bar */}
        {showFilters && (
          <div className="relative animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between mb-1 px-1 text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Search & Multi-Variable Filters</span>
              <button
                onClick={() => setShowFilters(false)}
                className="text-slate-400 hover:text-white flex items-center gap-0.5"
              >
                <X className="h-3 w-3" /> <span>Close</span>
              </button>
            </div>
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              totalMatches={analytics.filteredRecords.length}
              onSelectSearchSuggestion={handleSearchSuggestion}
              cityName={currentCityName}
              roadShortcuts={dynamicRoadShortcuts}
            />
          </div>
        )}

        {/* COLLAPSIBLE DRAWER: What-If Scenario Simulator */}
        {showSimulator && (
          <div className="relative animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between mb-1 px-1 text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">What-If Risk Forecasting Simulator</span>
              <button
                onClick={() => setShowSimulator(false)}
                className="text-slate-400 hover:text-white flex items-center gap-0.5"
              >
                <X className="h-3 w-3" /> <span>Close</span>
              </button>
            </div>
            <WhatIfSimulator
              scenario={scenario}
              setScenario={setScenario}
              hotspots={analytics.hotspots}
              onSelectHotspot={hs => {
                setSelectedHotspot(hs);
                setSearchTarget([hs.centerLat, hs.centerLng]);
              }}
            />
          </div>
        )}

        {/* TAB 1: INTERACTIVE MAP & BLACKSPOTS (OUTCOME 1) */}
        {activeTab === 'map' && (
          <div className="space-y-3">
            {/* Map & Timeline Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-blue-400" />
                  {isCustomData ? `${currentCityName} Geospatial Risk Surface` : 'Delhi Geospatial Risk Surface'}
                </span>
                <span className="text-slate-400 hidden sm:inline">
                  • Click any pulsing marker to inspect causality & civil engineering fixes
                </span>
              </div>

              {/* Time Slider Animation */}
              <TimeSliderAnimation
                selectedYear={selectedYear}
                onSelectYear={handleTimelineYearChange}
              />
            </div>

            {/* Map Container (Prominent, High-Resolution 540px Viewport) */}
            <div className="h-[540px] w-full rounded-xl overflow-hidden border border-slate-800 shadow-md isolate relative z-0">
              <MapWrapper
                hotspots={analytics.hotspots}
                officialBlackspots={DELHI_OFFICIAL_BLACKSPOTS}
                rawRecords={analytics.filteredRecords}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={hs => {
                  setSelectedHotspot(hs);
                  setSearchTarget([hs.centerLat, hs.centerLng]);
                }}
                scenario={scenario}
                searchTarget={searchTarget}
                isCustomData={isCustomData}
                customBounds={activeBounds}
                cityName={currentCityName}
              />
            </div>

            {/* COLLAPSIBLE: Top 10 Priority Table */}
            {showTable && (
              <div className="relative animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between mb-1 px-1 text-[11px] text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Top 10 High-Risk Black Spot Priority Ranking</span>
                  <button
                    onClick={() => setShowTable(false)}
                    className="text-slate-400 hover:text-white flex items-center gap-0.5"
                  >
                    <X className="h-3 w-3" /> <span>Close</span>
                  </button>
                </div>
                <TopHotspotsTable
                  hotspots={analytics.hotspots}
                  selectedHotspot={selectedHotspot}
                  onSelectHotspot={hs => {
                    setSelectedHotspot(hs);
                    setSearchTarget([hs.centerLat, hs.centerLng]);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PATTERN & RISK FACTOR ANALYTICS (OUTCOME 2) */}
        {activeTab === 'analytics' && (
          <AnalyticsCharts
            records={analytics.filteredRecords}
          />
        )}

        {/* TAB 3: DECISION SUPPORT FOR ROAD SAFETY PLANNING (OUTCOME 3) */}
        {activeTab === 'planning' && (
          <DecisionSupportTab
            hotspots={analytics.hotspots}
            onSelectHotspot={hs => {
              setSelectedHotspot(hs);
              setSearchTarget([hs.centerLat, hs.centerLng]);
            }}
            onOpenPrintReport={hs => {
              setSelectedHotspot(hs);
              setIsPrintOpen(true);
            }}
            cityName={currentCityName}
            scenario={scenario}
            setScenario={setScenario}
            onSwitchToMap={() => setActiveTab('map')}
          />
        )}

        {/* TAB 4: OFFICIAL STATUTORY BENCHMARK VALIDATION */}
        {activeTab === 'validation' && (
          <ValidationTab
            validation={analytics.validation}
            onSelectHotspotByName={name => {
              const matched = analytics.hotspots.find(h =>
                h.name.toLowerCase().includes(name.toLowerCase())
              );
              if (matched) {
                setSelectedHotspot(matched);
                setSearchTarget([matched.centerLat, matched.centerLng]);
                setActiveTab('map');
              }
            }}
            cityName={currentCityName}
            isCustomData={isCustomData}
          />
        )}
      </main>

      {/* Side Panel: Hotspot Detail Drawer */}
      <HotspotDetailDrawer
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        scenario={scenario}
        onOpenPrintReport={hs => {
          setSelectedHotspot(hs);
          setIsPrintOpen(true);
        }}
      />

      {/* Modal: CSV Upload */}
      <CSVUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleCustomUpload}
        onResetDefault={handleResetDefault}
        isCustomActive={isCustomData}
      />

      {/* Modal: Printable Safety Audit Report */}
      <PrintableReportModal
        hotspot={selectedHotspot || (analytics.hotspots.length > 0 ? analytics.hotspots[0] : null)}
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        cityName={currentCityName}
      />

      {/* Modal: Demo Tour for Judges */}
      <DemoTourModal
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        cityName={currentCityName}
        topHotspotName={analytics.hotspots[0]?.name}
        onStep1FocusTopHotspot={handleFocusTopHotspot}
        onStep2OpenDrawer={() => {
          if (analytics.hotspots.length > 0) {
            setSelectedHotspot(analytics.hotspots[0]);
          }
        }}
        onStep3TriggerScenario={() => {
          setScenario({
            timeOfDay: 'night',
            weather: 'winter-fog',
            dayType: 'weekend',
            speedEnforcement: 'low',
          });
          setActiveTab('map');
        }}
        onStep4ValidationTab={() => {
          setActiveTab('validation');
        }}
      />
    </div>
  );
}
