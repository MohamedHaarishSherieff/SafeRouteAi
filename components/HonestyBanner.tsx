'use client';

import React, { useState } from 'react';
import { X, Info, RefreshCw } from 'lucide-react';

interface HonestyBannerProps {
  isCustomData?: boolean;
  cityName?: string;
  recordCount?: number;
  onResetDefault?: () => void;
}

export const HonestyBanner: React.FC<HonestyBannerProps> = ({
  isCustomData = false,
  cityName = 'Delhi NCR',
  recordCount = 3816,
  onResetDefault,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="border-b border-slate-800/80 bg-slate-900/60 px-4 py-2 text-xs text-slate-300 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-slate-400" />
          {isCustomData ? (
            <p>
              <strong className="text-white font-medium">Custom Ingestion:</strong> Analyzing{' '}
              <strong className="text-blue-400 font-semibold">{recordCount.toLocaleString()}</strong> records in{' '}
              <strong className="text-white">{cityName}</strong> with auto-calibrated DBSCAN and IRC risk weights.
            </p>
          ) : (
            <p>
              <strong className="text-white font-medium">Official Benchmark:</strong> Corridors calibrated to official{' '}
              <span className="text-white font-medium">Delhi Traffic Police & PWD</span> audits.
              Attributes structured in accordance with MoRTH urban crash profiles.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCustomData && onResetDefault && (
            <button
              onClick={onResetDefault}
              className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <RefreshCw className="h-3 w-3 text-slate-400" />
              <span>Restore Delhi Baseline</span>
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-slate-400 hover:text-white transition-colors"
            title="Dismiss notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
