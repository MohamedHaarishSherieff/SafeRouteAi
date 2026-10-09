'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Hotspot, OfficialBlackSpot, AccidentRecord, ScenarioState } from '@/types/accidents';
import { Loader2 } from 'lucide-react';

const DynamicMap = dynamic(
  () => import('./SafeRouteMap').then(mod => mod.SafeRouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#0b1120] text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <p className="text-xs font-medium">Initializing Satellite Geospatial Risk Engine...</p>
      </div>
    ),
  }
);

interface MapWrapperProps {
  hotspots: Hotspot[];
  officialBlackspots: OfficialBlackSpot[];
  rawRecords: AccidentRecord[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
  scenario: ScenarioState;
  searchTarget: [number, number] | null;
  isCustomData?: boolean;
  customBounds?: [[number, number], [number, number]];
  cityName?: string;
}

export const MapWrapper: React.FC<MapWrapperProps> = (props) => {
  return <DynamicMap {...props} />;
};
