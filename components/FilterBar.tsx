'use client';

import React from 'react';
import { FilterState, SeverityLevel, AccidentCause, WeatherCondition, RoadType, VehicleType, RiskTier } from '@/types/accidents';
import { Search, RotateCcw, Filter } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalMatches: number;
  onSelectSearchSuggestion?: (roadName: string) => void;
  cityName?: string;
  roadShortcuts?: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  totalMatches,
  onSelectSearchSuggestion,
  cityName = 'Delhi NCR',
  roadShortcuts,
}) => {
  // Local state for 0ms immediate typing responsiveness with 200ms debounced analytics trigger
  const [localSearch, setLocalSearch] = React.useState(filters.searchQuery);

  React.useEffect(() => {
    setLocalSearch(filters.searchQuery);
  }, [filters.searchQuery]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.searchQuery) {
        setFilters(prev => ({ ...prev, searchQuery: localSearch }));
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearch, filters.searchQuery, setFilters]);

  const resetFilters = () => {
    setLocalSearch('');
    setFilters({
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
  };

  const handleShortcutClick = (spot: string) => {
    setLocalSearch(spot);
    setFilters(prev => ({ ...prev, searchQuery: spot }));
    onSelectSearchSuggestion?.(spot);
  };

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.severity !== 'all' ||
    filters.cause !== 'all' ||
    filters.weather !== 'all' ||
    filters.roadType !== 'all' ||
    filters.vehicleType !== 'all' ||
    filters.timeOfDay !== 'all' ||
    filters.minRiskTier !== 'all' ||
    filters.startDate !== '' ||
    filters.endDate !== '';

  const quickSearchShortcuts =
    roadShortcuts && roadShortcuts.length > 0
      ? roadShortcuts
      : [
          'Mukundpur',
          'Outer Ring Road',
          'Dhaula Kuan',
          'Azadpur',
          'ISBT Kashmere Gate',
          'Peera Garhi',
          'Ashram Chowk',
        ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 backdrop-blur-md shadow-sm">
      {/* Top Row: Search and Quick Suggestions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            suppressHydrationWarning
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            placeholder={`Search ${cityName} road, junction, or corridor (e.g. ${quickSearchShortcuts.slice(0, 2).join(', ')})...`}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                setFilters(prev => ({ ...prev, searchQuery: '' }));
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400">
          <span className="shrink-0 text-slate-500">Quick Jump:</span>
          {quickSearchShortcuts.map(spot => (
            <button
              key={spot}
              onClick={() => handleShortcutClick(spot)}
              className={`rounded-md border px-2 py-0.5 text-xs transition-colors whitespace-nowrap ${
                localSearch.toLowerCase() === spot.toLowerCase()
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {spot}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Selectors Row */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 text-xs">
        {/* Severity */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-400">Severity</label>
          <select
            suppressHydrationWarning
            value={filters.severity}
            onChange={e => setFilters(prev => ({ ...prev, severity: e.target.value as SeverityLevel | 'all' }))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="fatal">Fatal Crashes Only</option>
            <option value="grievous">Grievous Injuries</option>
            <option value="minor">Minor Injury</option>
            <option value="non-injury">Non-Injury / Property</option>
          </select>
        </div>

        {/* Cause */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-400">Cause / Violation</label>
          <select
            suppressHydrationWarning
            value={filters.cause}
            onChange={e => setFilters(prev => ({ ...prev, cause: e.target.value as AccidentCause | 'all' }))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Causes</option>
            <option value="overspeeding">Overspeeding</option>
            <option value="drunk-driving">Drunk Driving</option>
            <option value="red-light-jumping">Red Light Jumping</option>
            <option value="distracted-driving">Distracted Driving</option>
            <option value="wrong-side-driving">Wrong-Side Driving</option>
            <option value="poor-visibility">Poor Visibility</option>
            <option value="lane-indiscipline">Lane Cutting</option>
          </select>
        </div>

        {/* Weather */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-400">Weather Condition</label>
          <select
            suppressHydrationWarning
            value={filters.weather}
            onChange={e => setFilters(prev => ({ ...prev, weather: e.target.value as WeatherCondition | 'all' }))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Weather</option>
            <option value="clear">Clear Skies</option>
            <option value="fog">Winter Fog (Dec-Jan)</option>
            <option value="rain">Monsoon Rain (Wet)</option>
            <option value="smog">Severe Smog</option>
            <option value="overcast">Overcast</option>
          </select>
        </div>

        {/* Road Type */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-400">Road Geometry</label>
          <select
            suppressHydrationWarning
            value={filters.roadType}
            onChange={e => setFilters(prev => ({ ...prev, roadType: e.target.value as RoadType | 'all' }))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Geometries</option>
            <option value="highway">Expressway / Highway</option>
            <option value="flyover-approach">Flyover Ramp / Approach</option>
            <option value="junction">Signalized Junction</option>
            <option value="arterial">Major Arterial Road</option>
            <option value="residential">Residential / Local</option>
          </select>
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-400">Vehicle Involved</label>
          <select
            suppressHydrationWarning
            value={filters.vehicleType}
            onChange={e => setFilters(prev => ({ ...prev, vehicleType: e.target.value as VehicleType | 'all' }))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Vehicles</option>
            <option value="two-wheeler">Two-Wheeler (Motorcycle)</option>
            <option value="pedestrian">Pedestrian</option>
            <option value="car-taxi">Car / Taxi</option>
            <option value="heavy-commercial">Heavy Commercial (Truck)</option>
            <option value="auto-rickshaw">Auto-Rickshaw</option>
            <option value="bus">Bus</option>
          </select>
        </div>

        {/* Time of Day */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-400">Time of Day</label>
          <select
            suppressHydrationWarning
            value={filters.timeOfDay}
            onChange={e => setFilters(prev => ({ ...prev, timeOfDay: e.target.value as FilterState['timeOfDay'] }))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Hours</option>
            <option value="morning-rush">Morning Rush (07-11)</option>
            <option value="afternoon">Afternoon (12-16)</option>
            <option value="evening-rush">Evening Peak (17-21)</option>
            <option value="night">Night Hours (21-04)</option>
            <option value="late-night">Late Night (23-04)</option>
          </select>
        </div>

        {/* Risk Tier */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-400">Risk Tier</label>
          <select
            suppressHydrationWarning
            value={filters.minRiskTier}
            onChange={e => setFilters(prev => ({ ...prev, minRiskTier: e.target.value as RiskTier | 'all' }))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="Critical">Critical (Tier 1)</option>
            <option value="High">High (Tier 2)</option>
            <option value="Medium">Medium (Tier 3)</option>
            <option value="Low">Low (Tier 4)</option>
          </select>
        </div>
      </div>

      {/* Filter Summary & Reset Bar */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="h-3.5 w-3.5 text-blue-400" />
          <span>
            Showing <strong className="text-white">{totalMatches.toLocaleString()}</strong> filtered crash incidents
          </span>
          {hasActiveFilters && (
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-300">
              Active Filters
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
