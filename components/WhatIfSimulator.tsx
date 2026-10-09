'use client';

import React from 'react';
import { ScenarioState, Hotspot } from '@/types/accidents';
import { Sliders, Sun, Moon, EyeOff, AlertOctagon } from 'lucide-react';
import { simulateHotspotScenarioRisk } from '@/lib/analytics/predictiveModel';

interface WhatIfSimulatorProps {
  scenario: ScenarioState;
  setScenario: React.Dispatch<React.SetStateAction<ScenarioState>>;
  hotspots: Hotspot[];
  onSelectHotspot: (hotspot: Hotspot) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  scenario,
  setScenario,
  hotspots,
  onSelectHotspot,
}) => {
  // Pre-calculate scenario deltas for all hotspots
  const scenarioResults = hotspots.map(h => simulateHotspotScenarioRisk(h, scenario));
  const worsenedHotspots = scenarioResults.filter(r => r.isWorsened);

  // Calculate average scenario multiplier
  const avgMultiplier =
    scenarioResults.length > 0
      ? scenarioResults[0].contributingMultipliers.totalMultiplier
      : 1.0;

  // Preset scenarios
  const applyPreset = (preset: 'winter-fog' | 'monsoon-night' | 'strict-anpr' | 'baseline') => {
    if (preset === 'winter-fog') {
      setScenario({
        timeOfDay: 'night',
        weather: 'winter-fog',
        dayType: 'weekend',
        speedEnforcement: 'low',
      });
    } else if (preset === 'monsoon-night') {
      setScenario({
        timeOfDay: 'night',
        weather: 'heavy-rain',
        dayType: 'weekday',
        speedEnforcement: 'normal',
      });
    } else if (preset === 'strict-anpr') {
      setScenario({
        timeOfDay: 'day',
        weather: 'clear',
        dayType: 'weekday',
        speedEnforcement: 'strict',
      });
    } else {
      setScenario({
        timeOfDay: 'day',
        weather: 'clear',
        dayType: 'weekday',
        speedEnforcement: 'normal',
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-slate-800 p-2 text-blue-400 border border-slate-700">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Predictive &quot;What-If&quot; Policy Simulator
              </h3>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
                Poisson Model
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Forecast spatial risk shifts under adverse weather or strict radar speed enforcement
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Presets:</span>
          <button
            onClick={() => applyPreset('winter-fog')}
            className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Winter Fog
          </button>
          <button
            onClick={() => applyPreset('monsoon-night')}
            className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Monsoon Night
          </button>
          <button
            onClick={() => applyPreset('strict-anpr')}
            className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-slate-700 transition-colors"
          >
            Strict Radar ANPR
          </button>
          <button
            onClick={() => applyPreset('baseline')}
            className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Simulator Control Sliders & Radios */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        {/* 1. Time of Day */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
          <label className="mb-1.5 flex items-center justify-between font-medium text-slate-300">
            <span>Time of Day</span>
            <span className="text-[10px] text-indigo-400 font-semibold">
              {scenario.timeOfDay === 'night' ? '+38% Night Risk' : scenario.timeOfDay === 'fog-morning' ? '+45% Early Morning' : 'Baseline Traffic'}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setScenario(prev => ({ ...prev, timeOfDay: 'day' }))}
              className={`flex items-center justify-center gap-1 rounded py-1 px-1.5 text-xs transition-all ${
                scenario.timeOfDay === 'day'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="h-3 w-3" /> Day
            </button>
            <button
              onClick={() => setScenario(prev => ({ ...prev, timeOfDay: 'night' }))}
              className={`flex items-center justify-center gap-1 rounded py-1 px-1.5 text-xs transition-all ${
                scenario.timeOfDay === 'night'
                  ? 'bg-purple-600 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="h-3 w-3" /> Night
            </button>
            <button
              onClick={() => setScenario(prev => ({ ...prev, timeOfDay: 'fog-morning' }))}
              className={`flex items-center justify-center gap-1 rounded py-1 px-1.5 text-xs transition-all ${
                scenario.timeOfDay === 'fog-morning'
                  ? 'bg-amber-600 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <EyeOff className="h-3 w-3" /> Dawn Fog
            </button>
          </div>
        </div>

        {/* 2. Weather Condition */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
          <label className="mb-1.5 flex items-center justify-between font-medium text-slate-300">
            <span>Weather Condition</span>
            <span className="text-[10px] text-amber-400 font-semibold">
              {scenario.weather === 'winter-fog' ? '+52% Fog Hazard' : scenario.weather === 'heavy-rain' ? '+35% Skid Risk' : 'Clear Asphalt'}
            </span>
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(['clear', 'heavy-rain', 'winter-fog', 'smog-haze'] as const).map(w => {
              const label =
                w === 'clear'
                  ? '☀️ Clear'
                  : w === 'heavy-rain'
                  ? '🌧️ Rain'
                  : w === 'winter-fog'
                  ? '🌫️ Fog'
                  : '🏭 Smog';
              return (
                <button
                  key={w}
                  onClick={() => setScenario(prev => ({ ...prev, weather: w }))}
                  title={w.replace('-', ' ')}
                  className={`rounded py-1 px-1 text-[11px] font-medium text-center truncate transition-all ${
                    scenario.weather === w
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Day Type */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
          <label className="mb-1.5 flex items-center justify-between font-medium text-slate-300">
            <span>Day Type</span>
            <span className="text-[10px] text-slate-400">
              {scenario.dayType === 'weekend' ? 'Higher Night Speed' : 'High Volume Rush'}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setScenario(prev => ({ ...prev, dayType: 'weekday' }))}
              title="Weekday traffic volume"
              className={`rounded py-1 px-2 text-xs font-medium text-center transition-all ${
                scenario.dayType === 'weekday'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Weekday
            </button>
            <button
              onClick={() => setScenario(prev => ({ ...prev, dayType: 'weekend' }))}
              title="Weekend night speed variance"
              className={`rounded py-1 px-2 text-xs font-medium text-center transition-all ${
                scenario.dayType === 'weekend'
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Weekend
            </button>
          </div>
        </div>

        {/* 4. Speed Enforcement */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
          <label className="mb-1.5 flex items-center justify-between font-medium text-slate-300">
            <span>Speed Enforcement</span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {scenario.speedEnforcement === 'strict' ? '-28% Crash Drop' : scenario.speedEnforcement === 'low' ? '+25% Over-Speeding' : 'Baseline Patrol'}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setScenario(prev => ({ ...prev, speedEnforcement: 'low' }))}
              title="Low / Absent Speed Patrols (+25% risk)"
              className={`rounded py-1 px-1 text-[11px] font-medium text-center transition-all ${
                scenario.speedEnforcement === 'low'
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Low
            </button>
            <button
              onClick={() => setScenario(prev => ({ ...prev, speedEnforcement: 'normal' }))}
              title="Standard Municipal Patrol"
              className={`rounded py-1 px-1 text-[11px] font-medium text-center transition-all ${
                scenario.speedEnforcement === 'normal'
                  ? 'bg-slate-700 text-white font-semibold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setScenario(prev => ({ ...prev, speedEnforcement: 'strict' }))}
              title="Strict Automated Radar Cameras (-28% risk)"
              className={`rounded py-1 px-1 text-[11px] font-medium text-center transition-all ${
                scenario.speedEnforcement === 'strict'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Strict ANPR
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Output Banner */}
      <div className="mt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-sm ${
              avgMultiplier > 1.25
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : avgMultiplier < 0.9
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {avgMultiplier}x
          </div>
          <div>
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>Forecasted Risk Multiplier: {avgMultiplier}x</span>
              {avgMultiplier > 1.25 ? (
                <span className="text-[10px] text-rose-400 font-bold">⚠️ CRITICAL SURGE DETECTED</span>
              ) : avgMultiplier < 0.9 ? (
                <span className="text-[10px] text-emerald-400 font-bold">✓ SAFETY INTERVENTION EFFECTIVE</span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">MODERATE VARIATION</span>
              )}
            </div>
            <p className="text-slate-400 text-[11px]">
              {scenarioResults[0]?.explanation || 'Simulated environmental and policy risk adjustments active.'}
            </p>
          </div>
        </div>

        {/* Worsened Hotspots Quick Jump */}
        {worsenedHotspots.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-red-400 font-medium shrink-0 flex items-center gap-1">
              <AlertOctagon className="h-3 w-3" />
              {worsenedHotspots.length} Worsened:
            </span>
            {worsenedHotspots.slice(0, 3).map(res => {
              const hs = hotspots.find(h => h.id === res.hotspotId);
              if (!hs) return null;
              return (
                <button
                  key={res.hotspotId}
                  onClick={() => onSelectHotspot(hs)}
                  className="rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-500/20 whitespace-nowrap transition-colors"
                >
                  {hs.name.split(' ')[0]} (+{res.deltaPercentage}%)
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
