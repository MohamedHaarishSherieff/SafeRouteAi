'use client';

import React, { useState } from 'react';
import { Hotspot } from '@/types/accidents';
import { Navigation, ArrowUpDown, Flame } from 'lucide-react';

interface TopHotspotsTableProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
}

export const TopHotspotsTable: React.FC<TopHotspotsTableProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
}) => {
  const [sortBy, setSortBy] = useState<'risk' | 'fatal' | 'total'>('risk');

  const sorted = [...hotspots].sort((a, b) => {
    if (sortBy === 'fatal') return b.fatalCount - a.fatalCount;
    if (sortBy === 'total') return b.totalCrashes - a.totalCrashes;
    return b.riskScore - a.riskScore;
  });

  const top10 = sorted.slice(0, 10);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-md overflow-hidden">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            Top High-Risk Black Spot Priority Ranking
          </h3>
          <p className="text-xs text-slate-400">
            Ranked by AI multi-factor risk index combining lethality, crash density, and road exposure
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 mr-1 text-[11px] flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> Sort by:
          </span>
          <button
            onClick={() => setSortBy('risk')}
            className={`rounded px-2.5 py-1 text-xs transition-colors ${
              sortBy === 'risk'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Risk Score
          </button>
          <button
            onClick={() => setSortBy('fatal')}
            className={`rounded px-2.5 py-1 text-xs transition-colors ${
              sortBy === 'fatal'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Fatalities
          </button>
          <button
            onClick={() => setSortBy('total')}
            className={`rounded px-2.5 py-1 text-xs transition-colors ${
              sortBy === 'total'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Total Crashes
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase font-semibold text-slate-400">
            <tr>
              <th className="py-2.5 px-3">Priority Rank</th>
              <th className="py-2.5 px-3">Black Spot Location</th>
              <th className="py-2.5 px-3">Corridor / Road</th>
              <th className="py-2.5 px-3 text-center">Fatal</th>
              <th className="py-2.5 px-3 text-center">Total Crashes</th>
              <th className="py-2.5 px-3">Risk Index</th>
              <th className="py-2.5 px-3">Tier</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {top10.map((hs, index) => {
              const isSelected = selectedHotspot?.id === hs.id;
              const isCritical = hs.riskTier === 'Critical';

              return (
                <tr
                  key={hs.id}
                  onClick={() => onSelectHotspot(hs)}
                  className={`cursor-pointer transition-colors hover:bg-slate-800/50 ${
                    isSelected ? 'bg-blue-600/10 border-l-4 border-blue-500' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        index === 0
                          ? 'bg-rose-500 text-white font-extrabold shadow-sm'
                          : index < 3
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{hs.name}</div>
                    {hs.officialAnchorMatch && (
                      <span className="text-[10px] text-blue-400 font-medium">
                        ✓ Official DTP Anchor
                      </span>
                    )}
                  </td>

                  {/* Corridor */}
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-[160px]">
                    {hs.roadName}
                  </td>

                  {/* Fatal */}
                  <td className="py-2.5 px-3 text-center font-bold text-red-400">
                    {hs.fatalCount}
                  </td>

                  {/* Total */}
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-200">
                    {hs.totalCrashes}
                  </td>

                  {/* Risk Score */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">{hs.riskScore}</span>
                      <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isCritical ? 'bg-red-500' : hs.riskTier === 'High' ? 'bg-amber-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${hs.riskScore}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Tier */}
                  <td className="py-2.5 px-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        isCritical
                          ? 'bg-red-500/20 text-red-400'
                          : hs.riskTier === 'High'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {hs.riskTier}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHotspot(hs);
                      }}
                      className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      <Navigation className="h-3 w-3" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
