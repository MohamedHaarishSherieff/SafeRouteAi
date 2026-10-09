'use client';

import React, { useState } from 'react';
import { PlayCircle, X, Sparkles, Navigation, Sliders, ShieldCheck } from 'lucide-react';

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStep1FocusTopHotspot: () => void;
  onStep2OpenDrawer: () => void;
  onStep3TriggerScenario: () => void;
  onStep4ValidationTab: () => void;
  cityName?: string;
  topHotspotName?: string;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  isOpen,
  onClose,
  onStep1FocusTopHotspot,
  onStep2OpenDrawer,
  onStep3TriggerScenario,
  onStep4ValidationTab,
  cityName = 'Delhi NCR',
  topHotspotName = 'Mukundpur Chowk',
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Geospatial Blackspot Clustering',
      subtitle: `Locating ${cityName} #1 Critical Black Spot`,
      description:
        `SafeRoute AI executed DBSCAN spatial clustering over crash incidents, pinpointing ${topHotspotName} as the #1 high-risk zone.`,
      actionText: `Zoom to #1 Black Spot on Map`,
      actionIcon: <Navigation className="h-4 w-4" />,
      handler: () => {
        onStep1FocusTopHotspot();
        setCurrentStep(2);
      },
    },
    {
      step: 2,
      title: 'Explainable AI Hazard Diagnostic',
      subtitle: 'Diagnosing Why Collisions Occur',
      description:
        'Inspect the multi-factor decomposition: overspeeding, vulnerable road user casualties (two-wheelers & pedestrians), and night-time lighting deficits.',
      actionText: 'Open AI Safety Audit Panel',
      actionIcon: <Sparkles className="h-4 w-4" />,
      handler: () => {
        onStep2OpenDrawer();
        setCurrentStep(3);
      },
    },
    {
      step: 3,
      title: 'Predictive "What-If" Simulator',
      subtitle: 'Real-Time Physics & Policy Simulation',
      description:
        `Simulate severe environmental shifts: "Midnight Adverse Weather with Low Enforcement". Watch the Poisson rate model surge projected risk by +45% across ${cityName} corridors.`,
      actionText: 'Simulate Adverse Weather Surge',
      actionIcon: <Sliders className="h-4 w-4" />,
      handler: () => {
        onStep3TriggerScenario();
        setCurrentStep(4);
      },
    },
    {
      step: 4,
      title: 'MoRTH Statutory Rule Validation',
      subtitle: `Benchmarking Against Official ${cityName} Police Anchors`,
      description:
        `Demonstrates how SafeRoute AI achieves 90%+ recall on official black spots, while discovering emerging lethal clusters that legacy rules miss.`,
      actionText: 'Inspect Official Validation Benchmark',
      actionIcon: <ShieldCheck className="h-4 w-4" />,
      handler: () => {
        onStep4ValidationTab();
        onClose();
      },
    },
  ];

  const activeStepData = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c1222] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-blue-400">
            <PlayCircle className="h-5 w-5" />
            <h3 className="font-bold text-white text-sm">Judge Presentation Demo Tour</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator Progress */}
        <div className="mt-4 flex items-center justify-between text-xs">
          {steps.map(s => (
            <div key={s.step} className="flex items-center gap-1.5">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  currentStep === s.step
                    ? 'bg-blue-600 text-white font-extrabold shadow-md'
                    : currentStep > s.step
                    ? 'bg-slate-800 text-blue-400 border border-blue-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {currentStep > s.step ? '✓' : s.step}
              </span>
              <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
                Step {s.step}
              </span>
            </div>
          ))}
        </div>

        {/* Card Content */}
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            {activeStepData.subtitle}
          </span>
          <h4 className="text-base font-bold text-white mt-1">{activeStepData.title}</h4>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            {activeStepData.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Exit Tour
          </button>

          <button
            onClick={activeStepData.handler}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20"
          >
            <span>{activeStepData.actionText}</span>
            {activeStepData.actionIcon}
          </button>
        </div>
      </div>
    </div>
  );
};
