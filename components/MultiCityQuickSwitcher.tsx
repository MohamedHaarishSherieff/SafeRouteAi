'use client';

import React, { useState, useMemo } from 'react';
import { CityClusterSummary } from '@/lib/data/universalCsvNormalizer';
import { MapPin, Search, ChevronDown, ChevronUp, Globe, X } from 'lucide-react';

interface MultiCityQuickSwitcherProps {
  availableCities: CityClusterSummary[];
  totalRecordsCount: number;
  selectedCityFilter: string;
  onSelectCity: (cityName: string) => void;
  activeRecordsCount: number;
  currentCityName: string;
}

const TOP_CITIES_LIMIT = 7;

export const MultiCityQuickSwitcher: React.FC<MultiCityQuickSwitcherProps> = ({
  availableCities,
  totalRecordsCount,
  selectedCityFilter,
  onSelectCity,
  activeRecordsCount,
  currentCityName,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Top prominent cities by accident volume
  const topCities = useMemo(() => {
    return availableCities.slice(0, TOP_CITIES_LIMIT);
  }, [availableCities]);

  // If active selected city is outside top cities, include it dynamically so it's always visible
  const isSelectedInTop = useMemo(() => {
    return (
      selectedCityFilter === 'ALL' ||
      topCities.some(c => c.name.toLowerCase() === selectedCityFilter.toLowerCase())
    );
  }, [selectedCityFilter, topCities]);

  const activeSelectedCityObj = useMemo(() => {
    if (isSelectedInTop || selectedCityFilter === 'ALL') return null;
    return availableCities.find(c => c.name.toLowerCase() === selectedCityFilter.toLowerCase()) || null;
  }, [isSelectedInTop, selectedCityFilter, availableCities]);

  // Search filtered cities for drawer
  const filteredCitiesForDrawer = useMemo(() => {
    if (!searchQuery.trim()) return availableCities;
    const q = searchQuery.toLowerCase().trim();
    return availableCities.filter(c => c.name.toLowerCase().includes(q));
  }, [availableCities, searchQuery]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 shadow-sm">
      {/* Header Info Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
          <span>Multi-City Ingestion ({availableCities.length.toLocaleString()} Municipalities Detected)</span>
          <span className="hidden lg:inline text-[11px] text-slate-400 font-normal">
            — Select any city to isolate local black spots & auto-zoom
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
          <span>Active View:</span>
          <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-white font-medium max-w-[260px] truncate">
            {selectedCityFilter === 'ALL' ? 'Pan-India (All)' : selectedCityFilter}
          </span>
          <span className="text-slate-500">({activeRecordsCount.toLocaleString()} crashes)</span>
        </div>
      </div>

      {/* Main Switcher Control Bar (Compact Single/Dual Line) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/80">
        {/* Left: Quick Access Pills (Top Cities Only) */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[280px]">
          {/* All Cities (Pan-India) Button */}
          <button
            onClick={() => onSelectCity('ALL')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedCityFilter === 'ALL'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Globe className="h-3 w-3" />
            <span>All Pan-India</span>
            <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px] text-slate-300 font-mono">
              {totalRecordsCount.toLocaleString()}
            </span>
          </button>

          {/* Top 7 Cities */}
          {topCities.map(city => {
            const isSelected = selectedCityFilter.toLowerCase() === city.name.toLowerCase();
            return (
              <button
                key={city.name}
                onClick={() => onSelectCity(city.name)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <span>{city.name}</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {city.count.toLocaleString()}
                </span>
              </button>
            );
          })}

          {/* Dynamically inserted pill if the active city is outside top 7 */}
          {activeSelectedCityObj && (
            <button
              onClick={() => onSelectCity(activeSelectedCityObj.name)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors bg-blue-600 text-white shadow-sm"
            >
              <span>{activeSelectedCityObj.name}</span>
              <span className="rounded bg-black/30 px-1.5 py-0.2 text-[10px] text-white font-mono">
                {activeSelectedCityObj.count.toLocaleString()}
              </span>
            </button>
          )}
        </div>

        {/* Right: Dropdown + Search Drawer Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Select Dropdown for all cities */}
          <div className="relative">
            <select
              value={selectedCityFilter}
              onChange={e => onSelectCity(e.target.value)}
              className="h-8 max-w-[210px] sm:max-w-[260px] rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              title="Select any detected city or regional cluster"
            >
              <option value="ALL">🌐 All Cities (Pan-India) — {totalRecordsCount.toLocaleString()}</option>
              <optgroup label={`All ${availableCities.length.toLocaleString()} Municipalities (Ranked by Crashes)`}>
                {availableCities.map(city => (
                  <option key={city.name} value={city.name}>
                    {city.name} ({city.count.toLocaleString()} crashes, {city.fatalCount} fatal)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Expand Drawer Button */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors border ${
              isDrawerOpen
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
            }`}
            title="Search and browse all cities"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Browse</span>
            <span>({availableCities.length})</span>
            {isDrawerOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Bounded Search Drawer */}
      {isDrawerOpen && (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-inner">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Filter across ${availableCities.length.toLocaleString()} cities or sectors (e.g. Pune, Indore, Kanpur)...`}
                className="w-full rounded-md border border-slate-700 bg-slate-900 pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-xs text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="text-[11px] text-slate-400 mb-2 font-mono flex justify-between">
            <span>Showing {filteredCitiesForDrawer.length.toLocaleString()} of {availableCities.length.toLocaleString()} municipalities</span>
            <span>Click any chip to isolate</span>
          </div>

          {/* Scrollable Container with Fixed Max-Height */}
          <div className="max-h-52 overflow-y-auto pr-1 flex flex-wrap items-center gap-1.5 border-t border-slate-800 pt-2 custom-scrollbar">
            {filteredCitiesForDrawer.length === 0 ? (
              <div className="w-full py-4 text-center text-xs text-slate-500">
                No cities found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCitiesForDrawer.map(city => {
                const isSelected = selectedCityFilter.toLowerCase() === city.name.toLowerCase();
                return (
                  <button
                    key={city.name}
                    onClick={() => {
                      onSelectCity(city.name);
                      setIsDrawerOpen(false);
                    }}
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{city.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded ${
                        isSelected ? 'bg-black/30 text-white' : 'text-slate-400 bg-slate-800'
                      }`}
                    >
                      {city.count.toLocaleString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

