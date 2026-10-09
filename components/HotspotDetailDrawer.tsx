'use client';

import React, { useState } from 'react';
import { Hotspot, ScenarioState } from '@/types/accidents';
import {
  X,
  AlertTriangle,
  Skull,
  TrendingUp,
  Sparkles,
  Printer,
  Clock,
  Loader2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { simulateHotspotScenarioRisk } from '@/lib/analytics/predictiveModel';

interface HotspotDetailDrawerProps {
  hotspot: Hotspot | null;
  onClose: () => void;
  scenario: ScenarioState;
  onOpenPrintReport: (hotspot: Hotspot) => void;
}

export const HotspotDetailDrawer: React.FC<HotspotDetailDrawerProps> = ({
  hotspot,
  onClose,
  scenario,
  onOpenPrintReport,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'factors' | 'fixes' | 'ai'>('overview');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiBrief, setGeminiBrief] = useState<string | null>(null);
  const [geminiSource, setGeminiSource] = useState<string | null>(null);

  if (!hotspot) return null;

  const scenarioResult = simulateHotspotScenarioRisk(hotspot, scenario);

  const fetchAiInsights = async () => {
    setGeminiLoading(true);
    setActiveTab('ai');
    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotspotName: hotspot.name,
          riskScore: hotspot.riskScore,
          riskTier: hotspot.riskTier,
          totalCrashes: hotspot.totalCrashes,
          fatalCount: hotspot.fatalCount,
          casualties: hotspot.totalCasualties,
          topCause: hotspot.contributingFactors.causes[0]?.label || 'Speeding',
          topVehicle: hotspot.contributingFactors.vehicles[0]?.label || 'Two-Wheelers',
          peakHours: '20:00 - 01:00',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeminiBrief(data.brief);
        setGeminiSource(data.source);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeminiLoading(false);
    }
  };

  // Prepare hourly data for Recharts
  const hourlyData = hotspot.contributingFactors.peakHours.map(p => ({
    hour: `${p.hour}:00`,
    crashes: p.count,
  }));

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border border-red-500/40';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex justify-end animate-in fade-in duration-200">
      {/* Backdrop overlay: dims background and closes on outside click */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-10 w-full max-w-lg border-l border-slate-800 bg-[#0c1222] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getTierBadge(hotspot.riskTier)}`}>
              {hotspot.riskTier} Tier 1 Black Spot
            </span>
            {hotspot.officialAnchorMatch && (
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
                Official DTP Anchor
              </span>
            )}
          </div>
          <h2 className="mt-1 text-lg font-bold text-white tracking-tight">{hotspot.name}</h2>
          <p className="text-xs text-slate-400">{hotspot.roadName}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenPrintReport(hotspot)}
            className="flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-600/20 px-2.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/40 hover:text-white transition-all shadow-sm"
            title="Generate printable official statutory Road Safety Audit Memo"
          >
            <Printer className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Audit Memo</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('factors')}
          className={`py-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'factors'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Contributing Factors
        </button>
        <button
          onClick={() => setActiveTab('fixes')}
          className={`py-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'fixes'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Engineering Fixes ({hotspot.recommendations.length})
        </button>
        <button
          onClick={fetchAiInsights}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'ai'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-purple-300 hover:text-purple-200'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>AI Brief</span>
        </button>
      </div>

      {/* Drawer Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Risk Gauge Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400">COMPOSITE RISK INDEX</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">{hotspot.riskScore}</span>
                    <span className="text-sm text-slate-400">/ 100</span>
                    <span className={`ml-2 rounded px-2 py-0.5 text-xs font-bold ${getTierBadge(hotspot.riskTier)}`}>
                      {hotspot.riskTier}
                    </span>
                  </div>
                </div>

                {/* Circular visual score representation */}
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-red-500 bg-red-500/10">
                  <span className="text-sm font-black text-red-400">{hotspot.riskScore}</span>
                </div>
              </div>

              {/* What-if scenario comparison */}
              <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Scenario Forecast:</span>
                  <span className={`font-bold ${scenarioResult.isWorsened ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {scenarioResult.scenarioScore}/100 ({scenarioResult.deltaPercentage >= 0 ? '+' : ''}{scenarioResult.deltaPercentage}%)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{scenarioResult.explanation}</p>
              </div>
            </div>

            {/* Incident Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                <Skull className="mx-auto h-4 w-4 text-red-500 mb-1" />
                <span className="text-base font-bold text-white">{hotspot.fatalCount}</span>
                <div className="text-[10px] text-slate-400">Fatal Crashes</div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                <AlertTriangle className="mx-auto h-4 w-4 text-amber-500 mb-1" />
                <span className="text-base font-bold text-white">{hotspot.grievousCount}</span>
                <div className="text-[10px] text-slate-400">Grievous Injuries</div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                <TrendingUp className="mx-auto h-4 w-4 text-blue-500 mb-1" />
                <span className="text-base font-bold text-white">{hotspot.totalCrashes}</span>
                <div className="text-[10px] text-slate-400">Total Crashes</div>
              </div>
            </div>

            {/* Natural Language Diagnostic: "Why is this location dangerous?" */}
            <div className="rounded-xl border border-red-500/20 bg-gradient-to-r from-red-950/20 to-slate-900/60 p-3.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-red-400 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span>AI Causality Diagnostic</span>
              </div>
              <p className="text-slate-200 leading-relaxed">{hotspot.whyDangerous}</p>
            </div>

            {/* Hourly Crash Distribution Chart */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-400" /> Hourly Accident Density (24h)
                </span>
                <span className="text-[10px] text-slate-400">Peak: 19:00 - 23:00</span>
              </div>
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={9} interval={3} />
                    <YAxis stroke="#64748b" fontSize={9} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }}
                    />
                    <Bar dataKey="crashes" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTRIBUTING FACTORS */}
        {activeTab === 'factors' && (
          <div className="space-y-4 text-xs">
            {/* Causative Violations */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
              <span className="font-semibold text-slate-200 mb-2 block">
                Primary Causative Violations
              </span>
              <div className="space-y-2">
                {hotspot.contributingFactors.causes.map((c, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                      <span>{c.label}</span>
                      <span className="font-semibold text-red-400">{c.percentage}% ({c.count} crashes)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Breakdown */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
              <span className="font-semibold text-slate-200 mb-2 block">
                Vulnerable Vehicle Share
              </span>
              <div className="space-y-2">
                {hotspot.contributingFactors.vehicles.map((v, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                      <span>{v.label}</span>
                      <span className="font-semibold text-amber-400">{v.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                        style={{ width: `${v.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Light & Weather Breakdown */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Lighting Exposure</span>
                <div className="mt-1 font-bold text-white">
                  {hotspot.contributingFactors.light[0]?.label || 'Darkness'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {hotspot.contributingFactors.light[0]?.percentage || 60}% of fatal incidents
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Weather Vulnerability</span>
                <div className="mt-1 font-bold text-white">
                  {hotspot.contributingFactors.weather[0]?.label || 'Clear'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Winter fog multiplies risk 1.5x
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ENGINEERING FIXES */}
        {activeTab === 'fixes' && (
          <div className="space-y-3 text-xs">
            <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-300 border border-blue-500/20 text-[11px]">
              Civil engineering countermeasures prioritize high fatality reduction per rupee invested based on IRC / MoRTH guidelines.
            </div>

            {hotspot.recommendations.map(rec => (
              <div
                key={rec.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2 transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-white text-xs leading-snug">{rec.title}</h4>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      rec.priority === 'Immediate'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">{rec.rationale}</p>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">
                      -{rec.expectedReductionPct}% Crash Drop
                    </span>
                    <span>•</span>
                    <span className="text-white font-medium">
                      Est. {rec.livesSavedEstPerYear} Lives Saved/Yr
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                      Cost: {rec.estimatedCost}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                      {rec.timeframe}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: GEMINI AI INSIGHTS */}
        {activeTab === 'ai' && (
          <div className="space-y-3 text-xs">
            {geminiLoading ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Loader2 className="h-7 w-7 animate-spin text-purple-400 mb-2" />
                <p className="font-semibold text-white">Synthesizing Safety Audit Intelligence...</p>
                <p className="text-[11px] text-slate-500 mt-1">Analyzing crash vectors and geometric hazards</p>
              </div>
            ) : geminiBrief ? (
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/10 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    Strategic Safety Audit Brief
                  </span>
                  <span className="text-[10px] text-purple-400/80 font-mono">
                    {geminiSource}
                  </span>
                </div>
                <div className="prose prose-invert prose-xs max-w-none text-slate-200 leading-relaxed whitespace-pre-line text-[11px]">
                  {geminiBrief}
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400">
                <button
                  onClick={fetchAiInsights}
                  className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500 transition-colors"
                >
                  Generate AI Safety Audit Brief
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="border-t border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
        <button
          onClick={() => onOpenPrintReport(hotspot)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Printer className="h-3.5 w-3.5 text-blue-400" />
          <span>Print Safety Audit Memo</span>
        </button>

        <button
          onClick={fetchAiInsights}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{geminiBrief ? 'Regenerate Brief' : 'Generate AI Brief'}</span>
        </button>
      </div>
    </div>
  </div>
);
};
