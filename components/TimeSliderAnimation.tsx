'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Calendar } from 'lucide-react';

const YEARS = ['all', '2021', '2022', '2023', '2024'];

interface TimeSliderAnimationProps {
  selectedYear: string; // 'all' | '2021' | '2022' | '2023' | '2024'
  onSelectYear: (year: string) => void;
}

export const TimeSliderAnimation: React.FC<TimeSliderAnimationProps> = ({
  selectedYear,
  onSelectYear,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        const currentIndex = YEARS.indexOf(selectedYear);
        const nextIndex = (currentIndex + 1) % YEARS.length;
        onSelectYear(YEARS[nextIndex]);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, selectedYear, onSelectYear]);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md shadow-md text-xs">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        title={isPlaying ? 'Pause timeline animation' : 'Play timeline animation'}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>

      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
        <Calendar className="h-3 w-3 text-blue-400" /> Timeline:
      </span>

      <div className="flex items-center gap-1">
        {YEARS.map(y => (
          <button
            key={y}
            onClick={() => {
              setIsPlaying(false);
              onSelectYear(y);
            }}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${
              selectedYear === y
                ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {y === 'all' ? 'All (2021-24)' : y}
          </button>
        ))}
      </div>
    </div>
  );
};
