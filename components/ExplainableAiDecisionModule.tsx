'use client';

import React, { useState, useMemo } from 'react';
import { Hotspot } from '@/types/accidents';
import { generateExplainableAiDiagnosis } from '@/lib/analytics/xaiEngine';
import {
  BrainCircuit,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Sliders,
} from 'lucide-react';

interface ExplainableAiDecisionModuleProps {
  hotspots: Hotspot[];
  cityName: string;
  onSelectHotspotForMap?: (hotspot: Hotspot) => void;
  onOpenPrintMemo?: (hotspot: Hotspot) => void;
}

export const ExplainableAiDecisionModule: React.FC<ExplainableAiDecisionModuleProps> = ({
  hotspots,
  cityName,
  onSelectHotspotForMap,
  onOpenPrintMemo,
}) => {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(
    hotspots[0]?.id || ''
  );
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [activeTab, setActiveTab] = useState<'attribution' | 'prescription' | 'memo'>('attribution');

  const activeHotspot = useMemo(() => {
    return hotspots.find(h => h.id === selectedHotspotId) || hotspots[0] || null;
  }, [hotspots, selectedHotspotId]);

  const xaiDiagnosis = useMemo(() => {
    if (!activeHotspot) return null;
    return generateExplainableAiDiagnosis(activeHotspot);
  }, [activeHotspot]);

  const handleCopyMemo = () => {
    if (!xaiDiagnosis) return;
    navigator.clipboard.writeText(xaiDiagnosis.tenderJustificationText);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2500);
  };

  if (!activeHotspot || !xaiDiagnosis) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Header & Corridor Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-200 border border-slate-700">
              <BrainCircuit className="h-3.5 w-3.5 text-blue-400" />
              <span>Explainable AI (XAI) Causal Diagnosis</span>
            </span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400 border border-slate-700">
              MoRTH & IRC Audit Model
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Transparent Risk Attribution & Countermeasure Justification
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl">
            Mathematical SHAP decomposition showing the exact empirical factors driving corridor hazard and the civil remedies selected to mitigate them.
          </p>
        </div>

        {/* Corridor Quick Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-medium text-slate-400">Corridor:</label>
          <select
            value={selectedHotspotId}
            onChange={e => setSelectedHotspotId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none max-w-[280px] cursor-pointer"
          >
            {hotspots.map((hs, idx) => (
              <option key={hs.id} value={hs.id}>
                #{idx + 1} {hs.name} ({hs.riskScore}/100)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Strip for Inspected Corridor */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Total Risk Index</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-rose-400">{xaiDiagnosis.totalRiskScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
            <span className="ml-auto rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300 border border-slate-700">
              {xaiDiagnosis.riskTier}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Primary Causal Vector</div>
          <div className="mt-1 text-sm font-semibold text-white truncate">{xaiDiagnosis.topCausalDriver}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
            {xaiDiagnosis.topCausalDriverPct}% of severe collisions
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Vulnerable User Share</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white">{xaiDiagnosis.vulnerableUserSharePct}%</span>
            <span className="text-[11px] text-slate-400">of victims</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pedestrians & 2-Wheelers</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Post-Remedy Residual Risk</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-400">{xaiDiagnosis.projectedPostInterventionScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
            <span className="ml-auto text-[11px] font-semibold text-emerald-400 font-mono">
              -{xaiDiagnosis.projectedReductionPct}%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Est. {xaiDiagnosis.livesSavedEstAnnual} lives saved/yr
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('attribution')}
          className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'attribution'
              ? 'border-blue-500 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Feature Attribution (SHAP)</span>
        </button>

        <button
          onClick={() => setActiveTab('prescription')}
          className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'prescription'
              ? 'border-blue-500 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Remedy Justification</span>
        </button>

        <button
          onClick={() => setActiveTab('memo')}
          className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'memo'
              ? 'border-blue-500 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Tender Justification Memo</span>
        </button>
      </div>

      {/* TAB 1: SHAP FEATURE ATTRIBUTION WATERFALL */}
      {activeTab === 'attribution' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="text-slate-300 font-medium">
              Additive SHAP Decomposition of {xaiDiagnosis.totalRiskScore}/100 Risk Score:
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Base: {xaiDiagnosis.baselineScore} pts + Deltas: {xaiDiagnosis.totalRiskScore - xaiDiagnosis.baselineScore} pts = {xaiDiagnosis.totalRiskScore} pts
            </span>
          </div>

          {/* Unified Cohesive Intensity Bar */}
          <div className="h-3.5 w-full rounded-md bg-slate-950 border border-slate-800 flex overflow-hidden p-0.5">
            {xaiDiagnosis.featureAttributions.map((attr, idx) => {
              // Cohesive, dignified risk intensity scale (Neutral Slate to Deep Crimson)
              const toneColors = [
                'bg-slate-600',  // baseline
                'bg-rose-600',   // fatal
                'bg-rose-700',   // vulnerable
                'bg-amber-600',  // speed
                'bg-amber-700',  // grievous
                'bg-slate-700',  // darkness
                'bg-slate-800',  // geometry
              ];
              const color = toneColors[idx % toneColors.length];
              return (
                <div
                  key={attr.id}
                  style={{ width: `${Math.max(4, attr.percentageOfRisk)}%` }}
                  className={`h-full ${color} transition-all relative group cursor-pointer first:rounded-l last:rounded-r`}
                  title={`${attr.name}: +${attr.points} pts (${attr.percentageOfRisk}%)`}
                />
              );
            })}
          </div>

          {/* Detailed Attribution Rows */}
          <div className="space-y-1.5">
            {xaiDiagnosis.featureAttributions.map((attr, idx) => {
              const isBaseline = attr.direction === 'baseline';
              const dotColors = [
                'bg-slate-400',
                'bg-rose-500',
                'bg-rose-600',
                'bg-amber-500',
                'bg-amber-600',
                'bg-slate-500',
                'bg-slate-600',
              ];
              const dotColor = dotColors[idx % dotColors.length];

              return (
                <div
                  key={attr.id}
                  className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2 flex-1">
                    <span className={`h-2.5 w-2.5 rounded-full mt-1 ${dotColor} shrink-0`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-200 font-semibold">{attr.name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">({attr.statutoryStandard})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{attr.empiricalEvidence}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center font-mono">
                    <div className="text-right">
                      <span className={`text-xs font-bold ${isBaseline ? 'text-slate-300' : 'text-rose-400'}`}>
                        {isBaseline ? `${attr.points} pts` : `+${attr.points} pts`}
                      </span>
                      <div className="text-[10px] text-slate-500">{attr.percentageOfRisk}% of Risk</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PRESCRIPTIVE REMEDY MAPPING */}
      {activeTab === 'prescription' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="text-xs text-slate-400">
            Every prescribed civil engineering countermeasure directly targets a diagnosed causal risk factor:
          </div>

          <div className="space-y-2">
            {xaiDiagnosis.prescriptionMappings.map((presc, idx) => (
              <div
                key={presc.countermeasure.id || idx}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-300 border border-slate-700">
                      Step {idx + 1}
                    </span>
                    <strong className="text-xs font-semibold text-white">{presc.countermeasure.title}</strong>
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-medium text-slate-300 border border-slate-700 uppercase">
                      {presc.countermeasure.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-emerald-400 font-semibold">
                      -{presc.countermeasure.expectedReductionPct}% Crashes
                    </span>
                    <span className="text-slate-500">| Budget: {presc.countermeasure.estimatedCost}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                  <div>
                    <span className="text-[10px] font-medium uppercase text-slate-500">Targeted Causal Hazard:</span>
                    <div className="text-slate-300 font-medium mt-0.5 flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                      <span>{presc.targetedFeatureName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{presc.engineeringMechanism}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium uppercase text-slate-500">Statutory Basis:</span>
                    <div className="text-slate-300 font-medium mt-0.5">{presc.statutoryGuideline}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{presc.countermeasure.rationale}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STATUTORY TENDER JUSTIFICATION MEMO */}
      {activeTab === 'memo' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Government Administrative Sanction Note for E-Tenders & PWD Sanctions:
            </span>
            <button
              onClick={handleCopyMemo}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-semibold text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              {copiedMemo ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedMemo ? 'Copied!' : 'Copy Note'}</span>
            </button>
          </div>

          <pre className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
            {xaiDiagnosis.tenderJustificationText}
          </pre>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
            <span>Compliant with MoRTH Black Spot Protocol & Motor Vehicles Act 2019.</span>
            {onOpenPrintMemo && (
              <button
                onClick={() => onOpenPrintMemo(activeHotspot)}
                className="text-blue-400 hover:underline"
              >
                Preview Official PDF Memo →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
