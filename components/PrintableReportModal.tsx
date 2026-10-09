'use client';

import React, { useEffect } from 'react';
import { Hotspot } from '@/types/accidents';
import { X, Printer, ArrowLeft } from 'lucide-react';

interface PrintableReportModalProps {
  hotspot: Hotspot | null;
  isOpen: boolean;
  onClose: () => void;
  cityName?: string;
}

const AUDIT_DATE = '9 October 2026';

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  hotspot,
  isOpen,
  onClose,
  cityName = 'Delhi',
}) => {
  // Close on Escape key press & prevent background scrolling while open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !hotspot) return null;

  const handlePrint = () => {
    window.print();
  };

  const isDelhi = cityName.toLowerCase().includes('delhi');
  const stateOrCityGovt = isDelhi
    ? 'Government of National Capital Territory of Delhi'
    : `State Government & Municipal Corporation of ${cityName}`;
  const policeAndPwd = isDelhi
    ? 'Delhi Traffic Police & Public Works Department (PWD)'
    : `${cityName} Traffic Police & Municipal Works Department`;
  const official1 = isDelhi
    ? 'Special Commissioner of Police (Traffic)'
    : 'Joint Commissioner / Deputy Commissioner of Police (Traffic)';
  const official1HQ = isDelhi
    ? 'Delhi Traffic Police Headquarters, Todapur'
    : `${cityName} Metropolitan Traffic Police HQ`;
  const official2 = isDelhi
    ? 'Chief Engineer (Roads & Bridges)'
    : 'Chief Engineer (Highway Safety & Infrastructure)';
  const official2Dept = isDelhi
    ? 'Public Works Department (PWD), Govt. of NCT Delhi'
    : `Public Works & Urban Infrastructure Department, ${cityName}`;

  return (
    <div
      className="fixed inset-0 z-[100000] overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center items-start p-3 sm:p-6 lg:p-8 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Official Road Safety Audit Memo"
    >
      {/* Clickable backdrop overlay to dismiss immediately */}
      <div
        className="fixed inset-0 -z-10 cursor-pointer"
        onClick={onClose}
        title="Click background to close"
        aria-label="Close modal overlay"
      />

      {/* Floating Always-Visible Top-Right Quick Exit Pill (Print Hidden) */}
      <div className="fixed top-3 right-3 sm:top-5 sm:right-6 z-[100020] flex items-center gap-2 print:hidden">
        <button
          onClick={onClose}
          className="group flex items-center gap-1.5 rounded-full bg-slate-900/95 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/90 px-3.5 py-2 shadow-2xl backdrop-blur-md transition-all active:scale-95 text-xs font-semibold cursor-pointer"
          title="Return to dashboard (or press Esc)"
        >
          <ArrowLeft className="h-4 w-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
          <span className="hidden sm:inline-block rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
            ESC
          </span>
          <X className="h-4 w-4 ml-1 text-slate-400 group-hover:text-red-400" />
        </button>
      </div>

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden my-2 sm:my-6 print:border-none print:shadow-none print:m-0 print:p-0 print:bg-white">
        {/* Sticky Top Navigation & Action Bar (Print Hidden) */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 sm:px-6 py-3.5 backdrop-blur-md shadow-md print:hidden">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="group flex items-center gap-2 rounded-xl bg-slate-800/90 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-sm active:scale-95"
              title="Return to the dashboard (or press Esc)"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Dashboard</span>
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-300 border-l border-slate-800 pl-3">
              <Printer className="h-4 w-4 text-blue-400" />
              <span>Official Road Safety Audit Memo Preview</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/80 hover:border-red-500/30 transition-all active:scale-95 cursor-pointer"
              aria-label="Close memo"
              title="Close memo (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 print:p-0">
          <div
            id="printable-audit-report"
            className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 text-black shadow-lg print:border-none print:shadow-none print:p-0"
          >
            {/* Official Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-4 text-center">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                {stateOrCityGovt}
              </div>
              <div className="text-lg font-black text-slate-900 uppercase tracking-tight mt-0.5">
                {policeAndPwd}
              </div>
              <div className="text-xs font-semibold text-slate-700">
                Joint Road Safety Audit & Accident Black Spot Mitigation Cell
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500 font-mono">
                <span>DOC REF: RSA/{cityName.toUpperCase()}/2026/BS-{hotspot.id.toUpperCase()}</span>
                <span>DATE OF AUDIT: {AUDIT_DATE}</span>
                <span>CLASSIFICATION: HIGH-PRIORITY CIVIL ACTION</span>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div className="mt-5 space-y-4 text-xs">
              <div className="rounded-lg bg-slate-100 p-3 border border-slate-300">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">CORRIDOR LOCATION</span>
                    <div className="text-base font-extrabold text-slate-900">{hotspot.name}</div>
                    <div className="text-xs text-slate-700 font-medium">{hotspot.roadName}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-500">RISK INDEX</span>
                    <div className="text-2xl font-black text-red-600">{hotspot.riskScore}/100</div>
                    <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      {hotspot.riskTier} TIER 1
                    </span>
                  </div>
                </div>
              </div>

              {/* Incident Records Table */}
              <div>
                <h5 className="font-bold uppercase text-[11px] text-slate-800 tracking-wider mb-1.5">
                  1. Empirical Crash & Casualty Record (3-Year Baseline)
                </h5>
                <table className="w-full border-collapse border border-slate-300 text-center text-xs">
                  <thead className="bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="border border-slate-300 p-1.5">Total Crashes</th>
                      <th className="border border-slate-300 p-1.5 text-red-700">Fatal Crashes</th>
                      <th className="border border-slate-300 p-1.5 text-amber-700">Grievous Injury</th>
                      <th className="border border-slate-300 p-1.5">Minor Injury</th>
                      <th className="border border-slate-300 p-1.5">Total Human Casualties</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-slate-800">
                    <tr>
                      <td className="border border-slate-300 p-2">{hotspot.totalCrashes}</td>
                      <td className="border border-slate-300 p-2 text-red-700 font-extrabold">{hotspot.fatalCount}</td>
                      <td className="border border-slate-300 p-2 text-amber-700">{hotspot.grievousCount}</td>
                      <td className="border border-slate-300 p-2">{hotspot.minorCount}</td>
                      <td className="border border-slate-300 p-2 text-red-800">{hotspot.totalCasualties}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: AI Hazard Diagnostics */}
              <div>
                <h5 className="font-bold uppercase text-[11px] text-slate-800 tracking-wider mb-1">
                  2. AI Causal Hazard Diagnosis
                </h5>
                <p className="rounded bg-slate-50 p-2.5 text-slate-700 border border-slate-200 leading-relaxed text-xs">
                  {hotspot.whyDangerous}
                </p>
              </div>

              {/* Section 3: Civil Engineering Countermeasure Action Plan */}
              <div>
                <h5 className="font-bold uppercase text-[11px] text-slate-800 tracking-wider mb-1.5">
                  3. Mandatory Civil Engineering & Enforcement Mitigation Action Plan
                </h5>
                <div className="space-y-2">
                  {hotspot.recommendations.map((rec, i) => (
                    <div key={rec.id} className="rounded border border-slate-300 p-2 text-xs">
                      <div className="flex justify-between items-start">
                        <strong className="text-slate-900 font-bold">
                          {i + 1}. {rec.title}
                        </strong>
                        <span className="font-bold text-red-700 text-[10px] uppercase">
                          {rec.priority} Priority
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 text-[11px]">{rec.rationale}</p>
                      <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-500 border-t border-slate-200 pt-1">
                        <span className="text-emerald-700">Expected Crash Reduction: -{rec.expectedReductionPct}%</span>
                        <span>Target Timeframe: {rec.timeframe}</span>
                        <span>Budget Tier: {rec.estimatedCost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Sign-off Authority Blocks */}
              <div className="mt-8 pt-4 border-t border-slate-400 grid grid-cols-2 text-center text-xs">
                <div>
                  <div className="h-10" />
                  <div className="border-t border-slate-400 mx-8 pt-1 font-bold text-slate-800">
                    {official1}
                  </div>
                  <div className="text-[10px] text-slate-500">{official1HQ}</div>
                </div>

                <div>
                  <div className="h-10" />
                  <div className="border-t border-slate-400 mx-8 pt-1 font-bold text-slate-800">
                    {official2}
                  </div>
                  <div className="text-[10px] text-slate-500">{official2Dept}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer (Print Hidden) */}
        <div className="border-t border-slate-800 bg-slate-900/95 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-400" />
            <span>Return to Safety Planning</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-500 shadow-md transition-all active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
            >
              ✕ Close Memo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
