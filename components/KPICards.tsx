'use client';

import React from 'react';
import { KPIStats } from '@/types/accidents';
import { Activity, Skull, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';

interface KPICardsProps {
  kpis: KPIStats;
  onFocusTopHotspot: () => void;
  cityName?: string;
}

export const KPICards: React.FC<KPICardsProps> = ({
  kpis,
  onFocusTopHotspot,
  cityName = 'Delhi NCR',
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* 1. Total Incidents */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Total Crashes</span>
          <Activity className="h-4 w-4 text-slate-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-white">
            {kpis.totalAccidents.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">records</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400 truncate">
          Active records in {cityName}
        </div>
      </div>

      {/* 2. Fatalities */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Fatalities</span>
          <Skull className="h-4 w-4 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-rose-400">
            {kpis.fatalities.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">lives lost</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          {kpis.totalAccidents > 0
            ? `${((kpis.fatalities / kpis.totalAccidents) * 100).toFixed(1)}% fatality rate`
            : '0%'}
        </div>
      </div>

      {/* 3. Grievous Injuries */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Grievous Injuries</span>
          <AlertCircle className="h-4 w-4 text-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-amber-300">
            {kpis.grievousInjuries.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">trauma</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          {kpis.totalCasualties.toLocaleString()} total human casualties
        </div>
      </div>

      {/* 4. Critical Black Spots */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Critical Black Spots</span>
          <ShieldAlert className="h-4 w-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-white">
            {kpis.criticalHotspotsCount}
          </span>
          <span className="text-[10px] text-rose-400 font-medium">Tier 1</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          + {kpis.highHotspotsCount} High-risk corridors
        </div>
      </div>

      {/* 5. Highest Risk Corridor */}
      <div
        onClick={onFocusTopHotspot}
        className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-sm hover:border-slate-700 hover:bg-slate-800/80 cursor-pointer group transition-all"
        title="Click to locate on map"
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Highest Risk Spot</span>
          <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div className="mt-2 text-sm font-bold text-white truncate" title={kpis.highestRiskHotspotName}>
          {kpis.highestRiskHotspotName}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className="text-rose-400 font-semibold font-mono">Risk: {kpis.highestRiskScore}/100</span>
          <span className="text-blue-400 group-hover:underline">Locate on Map</span>
        </div>
      </div>
    </div>
  );
};
