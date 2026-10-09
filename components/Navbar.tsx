'use client';

import React, { useState } from 'react';
import {
  Shield,
  PlayCircle,
  FileSpreadsheet,
  BarChart3,
  MapPin,
  Database,
  CheckCircle2,
  Menu,
  X,
  Compass,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'analytics' | 'planning' | 'validation';
  setActiveTab: (tab: 'map' | 'analytics' | 'planning' | 'validation') => void;
  onOpenUpload: () => void;
  onStartDemoTour: () => void;
  onExportCSV: () => void;
  isCustomData: boolean;
  totalHotspots: number;
  cityName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onStartDemoTour,
  onExportCSV,
  isCustomData,
  totalHotspots,
  cityName = 'Delhi NCR',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayCity =
    cityName.includes('+') && cityName.length > 30
      ? 'Pan-India Multi-City'
      : cityName;

  const handleNavClick = (tab: 'map' | 'analytics' | 'planning' | 'validation') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/90 bg-[#090d16]/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6 max-w-7xl mx-auto w-full">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/80 text-blue-400 shadow-sm shrink-0">
            <Shield className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">
                SafeRoute <span className="text-blue-400">AI</span>
              </span>
              <span
                className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700 max-w-[180px] truncate"
                title={cityName}
              >
                {displayCity}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Outcome 1, 2, & 3) */}
        <nav className="hidden lg:flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/90 p-0.5 shrink-0">
          <button
            onClick={() => handleNavClick('map')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Outcome 1: Identification & visualization of accident-prone locations"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Map & Blackspots</span>
            <span className="ml-1 rounded bg-black/40 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
              {totalHotspots}
            </span>
          </button>

          <button
            onClick={() => handleNavClick('analytics')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Outcome 2: Data-driven understanding of accident patterns and risk factors"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Risk Patterns</span>
          </button>

          <button
            onClick={() => handleNavClick('planning')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'planning'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Outcome 3: Decision-support information for road-safety planning"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Safety Planning</span>
          </button>

          <button
            onClick={() => handleNavClick('validation')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'validation'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Statutory MoRTH 500m Benchmark Validation"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Validation</span>
          </button>
        </nav>

        {/* Desktop Action Controls */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={onStartDemoTour}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            title="Auto-guided presentation demo tour for judges"
          >
            <PlayCircle className="h-3.5 w-3.5 text-blue-400" />
            <span>Judge Tour</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Download ranked blackspot priority list as CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-semibold text-white transition-colors shadow-sm"
            title="Access 34 Indian city datasets library or upload your own CSV"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Dataset Hub</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="sm:hidden flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white"
          >
            <Database className="h-3 w-3" />
            <span>Data</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-[#0c1222] px-4 py-3 space-y-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
            Dashboard Modules
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleNavClick('map')}
              className={`flex items-center gap-2 rounded-md p-2 text-xs font-medium text-left transition-colors ${
                activeTab === 'map'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <div>
                <div>Map & Blackspots</div>
                <div className="text-[10px] opacity-75">{totalHotspots} Corridors</div>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('analytics')}
              className={`flex items-center gap-2 rounded-md p-2 text-xs font-medium text-left transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <div>
                <div>Risk Patterns</div>
                <div className="text-[10px] opacity-75">Causality & Timing</div>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('planning')}
              className={`flex items-center gap-2 rounded-md p-2 text-xs font-medium text-left transition-colors ${
                activeTab === 'planning'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <div>
                <div>Safety Planning</div>
                <div className="text-[10px] opacity-75">IRC Interventions</div>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('validation')}
              className={`flex items-center gap-2 rounded-md p-2 text-xs font-medium text-left transition-colors ${
                activeTab === 'validation'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Compass className="h-4 w-4" />
              <div>
                <div>MoRTH Validation</div>
                <div className="text-[10px] opacity-75">500m Protocol</div>
              </div>
            </button>
          </div>

          <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                onStartDemoTour();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 py-1.5 text-xs text-slate-200"
            >
              <PlayCircle className="h-3.5 w-3.5 text-blue-400" />
              <span>Judge Tour</span>
            </button>

            <button
              onClick={() => {
                onExportCSV();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 py-1.5 text-xs text-slate-300"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                onOpenUpload();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Datasets</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

