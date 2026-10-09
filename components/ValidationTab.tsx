'use client';

import React, { useState } from 'react';
import { ValidationSummary } from '@/types/accidents';
import { CheckCircle2, AlertOctagon, TrendingUp, ShieldAlert } from 'lucide-react';

interface ValidationTabProps {
  validation: ValidationSummary;
  onSelectHotspotByName: (name: string) => void;
  cityName?: string;
  isCustomData?: boolean;
}

export const ValidationTab: React.FC<ValidationTabProps> = ({
  validation,
  onSelectHotspotByName,
  cityName = 'Delhi NCR',
  isCustomData = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Matched' | 'AI-Only' | 'Rule-Only'>('all');

  const filteredComparisons = validation.comparisons.filter(c => {
    if (statusFilter === 'Matched') return c.status === 'Matched (AI+Rule)';
    if (statusFilter === 'AI-Only') return c.status === 'AI-Only (Emerging)';
    if (statusFilter === 'Rule-Only') return c.status === 'Rule-Only';
    return true;
  });

  const overlapPct = Math.round(
    (validation.truePositivesMatched / Math.max(1, validation.officialSpotsCount)) * 100
  );

  return (
    <div className="space-y-4">
      {/* Top Banner: Methodology & Authority Credibility */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-blue-950/40 p-4 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/40">
                {isCustomData ? `MoRTH Protocol Validation: ${cityName}` : 'MoRTH & Delhi Police Protocol Validation'}
              </span>
              <span className="text-xs text-slate-400">Section 7 Credibility Audit</span>
            </div>
            <h3 className="mt-1 text-base font-bold text-white tracking-tight">
              AI Spatial Clustering vs. Statutory 500m Rule Benchmark ({cityName})
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed max-w-4xl">
              Ministry of Road Transport & Highways (MoRTH) defines a statutory black spot by a static threshold:
              <strong className="text-white"> ≥3 Fatal Crashes or ≥10 Total Accidents within a 500-meter corridor</strong>.
              SafeRoute AI advances this using DBSCAN spatial density, recency decay, and road exposure weighting.
              {isCustomData
                ? ` Below is the comparative audit verifying statutory MoRTH rule compliance against AI Multi-Factor scoring across ${cityName}.`
                : ' Below is the rigorous validation benchmark against the 20 official Delhi Police historical black spot anchors.'}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Performance Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Overlap / Recall */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Official Anchor Recall</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-emerald-400">
              {overlapPct}%
            </span>
            <span className="text-[10px] text-slate-400">
              ({validation.truePositivesMatched}/{validation.officialSpotsCount})
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Official DTP black spots captured
          </div>
        </div>

        {/* Precision */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">AI Precision Index</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-blue-400">
              {Math.round(validation.precision * 100)}%
            </span>
            <span className="text-[10px] text-slate-400">p-score</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            High-confidence spatial clusters
          </div>
        </div>

        {/* F1 Score */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Harmonic F1 Score</span>
            <ShieldAlert className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-purple-400">
              {validation.f1Score}
            </span>
            <span className="text-[10px] text-slate-400">/ 1.0</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Balanced classification balance
          </div>
        </div>

        {/* Emerging Corridors Discovered */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-medium">AI Discovered Emerging</span>
            <AlertOctagon className="h-4 w-4 text-amber-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-amber-300">
              +{validation.aiDiscoveredEmergingHotspots}
            </span>
            <span className="text-[10px] text-amber-300/80">corridors</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-300/70">
            Identified before official 3-yr update
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Location-by-Location Validation Audit Table
            </h4>
            <p className="text-xs text-slate-400">
              Detailed breakdown of official anchors vs SafeRoute AI detections
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All ({validation.comparisons.length})
            </button>
            <button
              onClick={() => setStatusFilter('Matched')}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                statusFilter === 'Matched'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Matched ({validation.truePositivesMatched})
            </button>
            <button
              onClick={() => setStatusFilter('AI-Only')}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                statusFilter === 'AI-Only'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              AI-Only Emerging (+{validation.aiDiscoveredEmergingHotspots})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase font-semibold text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Location Name</th>
                <th className="py-2.5 px-3 text-center">Official Fatal</th>
                <th className="py-2.5 px-3 text-center">Official Total</th>
                <th className="py-2.5 px-3 text-center">Statutory Rule</th>
                <th className="py-2.5 px-3 text-center">AI Risk Rank</th>
                <th className="py-2.5 px-3">Classification Status</th>
                <th className="py-2.5 px-3">Scientific Audit Note</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredComparisons.map((row, idx) => {
                const isMatched = row.status === 'Matched (AI+Rule)';
                const isAiOnly = row.status === 'AI-Only (Emerging)';

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {row.name}
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold text-red-400">
                      {row.officialFatal}
                    </td>

                    <td className="py-2.5 px-3 text-center text-slate-300">
                      {row.officialTotal}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {row.ruleDetected ? (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          Triggered
                        </span>
                      ) : (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                          Under Threshold
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {row.aiRank ? (
                        <span className="font-extrabold text-blue-400">
                          #{row.aiRank} ({row.aiRiskScore}/100)
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          isMatched
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isAiOnly
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-300 text-[11px] max-w-xs">
                      {row.notes}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectHotspotByName(row.name.replace(' (Emerging AI Corridor)', ''))}
                        className="rounded bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        Locate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
