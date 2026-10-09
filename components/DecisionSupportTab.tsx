'use client';

import React, { useState, useMemo } from 'react';
import { Hotspot, ScenarioState } from '@/types/accidents';
import {
  ShieldAlert,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { ExplainableAiDecisionModule } from '@/components/ExplainableAiDecisionModule';

interface DecisionSupportTabProps {
  hotspots: Hotspot[];
  onSelectHotspot: (hotspot: Hotspot) => void;
  onOpenPrintReport: (hotspot: Hotspot) => void;
  cityName: string;
  scenario: ScenarioState;
  setScenario: React.Dispatch<React.SetStateAction<ScenarioState>>;
  onSwitchToMap: () => void;
}

export const DecisionSupportTab: React.FC<DecisionSupportTabProps> = ({
  hotspots,
  onSelectHotspot,
  onOpenPrintReport,
  cityName,
  scenario,
  setScenario,
  onSwitchToMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Calculate City-Wide Planning Aggregates
  const stats = useMemo(() => {
    let totalLivesSaved = 0;
    let immediateWorks = 0;
    let highWorks = 0;
    let lowCostCount = 0;
    let medCostCount = 0;
    let highCostCount = 0;
    let totalInterventions = 0;

    hotspots.forEach(h => {
      h.recommendations.forEach(r => {
        totalInterventions++;
        totalLivesSaved += r.livesSavedEstPerYear || 0;
        if (r.priority === 'Immediate') immediateWorks++;
        if (r.priority === 'High') highWorks++;
        if (r.estimatedCost === '₹') lowCostCount++;
        else if (r.estimatedCost === '₹₹') medCostCount++;
        else if (r.estimatedCost === '₹₹₹') highCostCount++;
      });
    });

    return {
      totalLivesSaved: Number(totalLivesSaved.toFixed(1)),
      immediateWorks,
      highWorks,
      lowCostCount,
      medCostCount,
      highCostCount,
      totalInterventions,
    };
  }, [hotspots]);

  // 2. Flatten all recommendations paired with their parent hotspot for the matrix
  const flattenedActionItems = useMemo(() => {
    const list: Array<{
      hotspot: Hotspot;
      rec: Hotspot['recommendations'][0];
    }> = [];

    hotspots.forEach(h => {
      h.recommendations.forEach(r => {
        list.push({ hotspot: h, rec: r });
      });
    });

    return list.filter(item => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.rec.category !== selectedCategory) {
        return false;
      }
      // Priority filter
      if (selectedPriority !== 'ALL' && item.rec.priority !== selectedPriority) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.hotspot.name.toLowerCase().includes(q);
        const matchesRoad = item.hotspot.roadName.toLowerCase().includes(q);
        const matchesTitle = item.rec.title.toLowerCase().includes(q);
        return matchesName || matchesRoad || matchesTitle;
      }
      return true;
    });
  }, [hotspots, selectedCategory, selectedPriority, searchQuery]);

  // 3. Export Consolidated Municipal Action Plan as CSV
  const handleExportPlanCSV = () => {
    const headers = [
      'Corridor Rank',
      'Corridor Name',
      'Road / Highway',
      'Risk Score (0-100)',
      'Risk Tier',
      'Civil Intervention Title',
      'Category',
      'Priority',
      'Budget Tier',
      'Target Timeframe',
      'Expected Crash Reduction %',
      'Est Lives Saved Per Year',
      'Engineering Rationale',
    ];

    const rows = flattenedActionItems.map(({ hotspot, rec }) => [
      `#${hotspots.indexOf(hotspot) + 1}`,
      `"${hotspot.name.replace(/"/g, '""')}"`,
      `"${hotspot.roadName.replace(/"/g, '""')}"`,
      hotspot.riskScore,
      hotspot.riskTier,
      `"${rec.title.replace(/"/g, '""')}"`,
      `"${rec.category.replace(/"/g, '""')}"`,
      rec.priority,
      rec.estimatedCost,
      `"${rec.timeframe}"`,
      `-${rec.expectedReductionPct}%`,
      rec.livesSavedEstPerYear,
      `"${rec.rationale.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${cityName.replace(/\s+/g, '_')}_Road_Safety_Decision_Plan_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Banner: Problem Statement Outcome 3 Callout */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700">
                Outcome 3: Decision-Support for Road-Safety Planning
              </span>
              <span className="rounded bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                MoRTH & IRC Protocol Compliant
              </span>
            </div>
            <h2 className="mt-1.5 text-lg font-bold text-white tracking-tight">
              Municipal Civil Engineering & Police Enforcement Decision Matrix
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 max-w-3xl leading-relaxed">
              Provides municipal commissioners, PWD engineers, and traffic police superintendents with actionable,
              prioritized road-safety interventions. Converts empirical crash causality into budgeted civil projects,
              simulation-tested policies, and official statutory audit memos.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportPlanCSV}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
              title="Download full municipal decision plan as CSV"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Safety Plan (CSV)</span>
            </button>
            {hotspots.length > 0 && (
              <button
                onClick={() => onOpenPrintReport(hotspots[0])}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors shadow-sm"
                title="Preview printable statutory Road Safety Audit memo"
              >
                <Printer className="h-4 w-4 text-slate-400" />
                <span>Print Audit Memo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. City-Wide Planning KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Lives Saved Potential */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Annual Lives Savable
            </span>
            <TrendingDown className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-400">{stats.totalLivesSaved}</span>
            <span className="text-xs text-slate-400 font-medium">Lives / Year</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            If prescribed IRC countermeasures are sanctioned across {hotspots.length} blackspots.
          </p>
        </div>

        {/* Card 2: Total Interventions */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Civil Works Prescribed
            </span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white">{stats.totalInterventions}</span>
            <span className="text-xs text-blue-400 font-medium">Action Items</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Across Pedestrian FOBs, ANPR radar, High-Mast lighting, & anti-skid paving.
          </p>
        </div>

        {/* Card 3: Immediate Works */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Immediate Priority
            </span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-400">{stats.immediateWorks}</span>
            <span className="text-xs text-slate-400 font-medium">Urgent Projects</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            High-lethality conflict zones requiring fast-track administrative sign-off.
          </p>
        </div>

        {/* Card 4: Budget Allocation Tiers */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Municipal Budget Tiers
            </span>
            <span className="text-xs font-mono text-slate-400">P.W.D. Matrix</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-bold">
            <div className="text-center">
              <span className="text-emerald-400">{stats.lowCostCount}</span>
              <p className="text-[10px] text-slate-400 font-normal">Low (₹)</p>
            </div>
            <div className="text-center">
              <span className="text-amber-400">{stats.medCostCount}</span>
              <p className="text-[10px] text-slate-400 font-normal">Mid (₹₹)</p>
            </div>
            <div className="text-center">
              <span className="text-rose-400">{stats.highCostCount}</span>
              <p className="text-[10px] text-slate-400 font-normal">Major (₹₹₹)</p>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Tiered by financial feasibility and statutory engineering lead times.
          </p>
        </div>
      </div>

      {/* 2.5 Explainable AI (XAI) Causal Diagnosis & Decision Matrix */}
      {hotspots.length > 0 && (
        <ExplainableAiDecisionModule
          hotspots={hotspots}
          cityName={cityName}
          onSelectHotspotForMap={hs => {
            onSelectHotspot(hs);
            onSwitchToMap();
          }}
          onOpenPrintMemo={onOpenPrintReport}
        />
      )}

      {/* 3. Interactive Policy Stress Tester (What-If Planning Simulator Integration) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Pre-Execution Policy Simulator for Municipal Planners
              </h3>
              <p className="text-xs text-slate-400">
                Simulate the statistical impact of administrative policies before capital deployment.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              Active Simulation: <span className="text-purple-300 font-bold">{scenario.weather} / {scenario.timeOfDay}</span>
            </span>
          </div>
        </div>

        {/* Quick Policy Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() =>
              setScenario({
                timeOfDay: 'day',
                weather: 'clear',
                dayType: 'weekday',
                speedEnforcement: 'strict',
              })
            }
            className={`rounded-xl border p-3 text-left transition-all ${
              scenario.speedEnforcement === 'strict'
                ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span>Policy 1: Radar Speed Enforcement</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Automated ANPR cameras reduce severe collision probability by <strong className="text-emerald-300">28%</strong>.
            </p>
          </button>

          <button
            onClick={() =>
              setScenario({
                timeOfDay: 'night',
                weather: 'winter-fog',
                dayType: 'weekend',
                speedEnforcement: 'low',
              })
            }
            className={`rounded-xl border p-3 text-left transition-all ${
              scenario.weather === 'winter-fog'
                ? 'border-amber-500/60 bg-amber-950/40 text-amber-200'
                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span>Policy 2: Winter Fog & Low Visibility</span>
              <span className="text-[10px] text-amber-400 font-mono">1.52x Surge</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Stress tests road network under extreme darkness and fog; highlights unlit corridors.
            </p>
          </button>

          <button
            onClick={() =>
              setScenario({
                timeOfDay: 'day',
                weather: 'heavy-rain',
                dayType: 'weekday',
                speedEnforcement: 'normal',
              })
            }
            className={`rounded-xl border p-3 text-left transition-all ${
              scenario.weather === 'heavy-rain'
                ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-200'
                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span>Policy 3: Wet Monsoon Surface</span>
              <span className="text-[10px] text-cyan-400 font-mono">1.35x Surge</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Identifies blackspots needing high-friction calcined bauxite anti-skid paving.
            </p>
          </button>
        </div>
      </div>

      {/* 4. Actionable Civil Engineering & Police Enforcement Decision Matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Comprehensive Municipal Road Safety Master Plan ({flattenedActionItems.length} Actions)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specific civil engineering remedies mapped to each blackspot corridor with estimated crash drops and budget brackets.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search corridor or fix..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Pedestrian Safety">Pedestrian Safety (FOBs)</option>
              <option value="Enforcement & Surveillance">Enforcement (ANPR/Radar)</option>
              <option value="Civil Engineering">Civil Engineering (Rumble/Surfacing)</option>
              <option value="Infrastructure">Infrastructure (Lighting/Studs)</option>
              <option value="Traffic Engineering">Traffic Engineering (Signals)</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="Immediate">Immediate Priority</option>
              <option value="High">High Priority</option>
            </select>
          </div>
        </div>

        {/* Master Plan Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-3">Corridor & Location</th>
                <th className="py-3 px-3">Risk Tier</th>
                <th className="py-3 px-3">Prescribed Civil Countermeasure</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Cost & Time</th>
                <th className="py-3 px-3 text-right">Expected Impact</th>
                <th className="py-3 px-3 text-center">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {flattenedActionItems.slice(0, 15).map(({ hotspot, rec }, idx) => {
                const rank = hotspots.indexOf(hotspot) + 1;
                return (
                  <tr
                    key={`${hotspot.id}-${rec.id}-${idx}`}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Corridor */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-300 font-mono">
                          #{rank}
                        </span>
                        <div>
                          <button
                            onClick={() => {
                              onSelectHotspot(hotspot);
                              onSwitchToMap();
                            }}
                            className="font-bold text-white hover:text-blue-400 hover:underline text-left text-xs"
                          >
                            {hotspot.name}
                          </button>
                          <div className="text-[10px] text-slate-400">{hotspot.roadName}</div>
                        </div>
                      </div>
                    </td>

                    {/* Risk Tier */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          hotspot.riskTier === 'Critical'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : hotspot.riskTier === 'High'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {hotspot.riskScore}/100
                      </span>
                    </td>

                    {/* Prescribed Countermeasure */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-200">{rec.title}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {rec.rationale}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60">
                        {rec.category}
                      </span>
                    </td>

                    {/* Cost & Time */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-mono font-bold text-amber-300 text-xs">
                        {rec.estimatedCost}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{rec.timeframe}</span>
                      </div>
                    </td>

                    {/* Impact */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="text-emerald-400 font-bold text-xs">
                        -{rec.expectedReductionPct}% Crashes
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium">
                        +{rec.livesSavedEstPerYear} Lives Saved/Yr
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenPrintReport(hotspot)}
                          className="flex items-center gap-1 rounded bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 px-2.5 py-1 text-[11px] font-semibold text-blue-300 transition-colors shadow-sm"
                          title="Generate printable official Road Safety Audit Memo for Police & PWD"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Audit Memo</span>
                        </button>
                        <button
                          onClick={() => {
                            onSelectHotspot(hotspot);
                            onSwitchToMap();
                          }}
                          className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Locate on satellite map"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
          <div>
            Showing <strong className="text-white">{Math.min(15, flattenedActionItems.length)}</strong> of{' '}
            <strong className="text-white">{flattenedActionItems.length}</strong> total prioritized engineering remedies for {cityName}.
          </div>
          <div className="flex items-center gap-2">
            <span>Aligned with IRC:SP:88-2019 (Road Safety Audit) & MoRTH Statutory Protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
};
