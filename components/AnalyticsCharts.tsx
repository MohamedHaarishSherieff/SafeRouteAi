'use client';

import React from 'react';
import { AccidentRecord } from '@/types/accidents';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Clock, Car, Calendar, AlertTriangle } from 'lucide-react';

interface AnalyticsChartsProps {
  records: AccidentRecord[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ records }) => {
  const { hourCounts, dayCounts, causeData, vehicleData } = React.useMemo(() => {
    // 1. Hourly Distribution
    const hours = new Array(24).fill(0).map((_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      total: 0,
      fatal: 0,
    }));

    // 2. Day of Week Distribution
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = dayNames.map(name => ({ day: name, crashes: 0, fatal: 0 }));

    // 3. Causative Violations
    const causeCounts = new Map<string, number>();

    // 4. Vehicle Type Counts
    const vehicleCounts = new Map<string, number>();

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      let h = 12;
      let day = 0;
      if (r.datetime) {
        const d = new Date(r.datetime);
        h = d.getUTCHours();
        day = d.getUTCDay();
      }

      if (h >= 0 && h < 24) {
        hours[h].total++;
        if (r.severity === 'fatal') hours[h].fatal++;
      }

      if (day >= 0 && day < 7) {
        days[day].crashes++;
        if (r.severity === 'fatal') days[day].fatal++;
      }

      causeCounts.set(r.cause, (causeCounts.get(r.cause) || 0) + 1);
      vehicleCounts.set(r.vehicle_type, (vehicleCounts.get(r.vehicle_type) || 0) + 1);
    }

    // Format Causes for chart
    const CAUSE_NAMES: Record<string, string> = {
      overspeeding: 'Overspeeding',
      'drunk-driving': 'Drunk Driving',
      'red-light-jumping': 'Red Light Jump',
      'distracted-driving': 'Distracted Driving',
      'wrong-side-driving': 'Wrong-Side Driving',
      'poor-visibility': 'Poor Visibility',
      'lane-indiscipline': 'Lane Cutting',
      'pedestrian-jaywalking': 'Jaywalking',
    };

    const causes = Array.from(causeCounts.entries())
      .map(([key, count]) => ({
        name: CAUSE_NAMES[key] || key,
        crashes: count,
      }))
      .sort((a, b) => b.crashes - a.crashes);

    // Format Vehicles
    const VEHICLE_NAMES: Record<string, string> = {
      'two-wheeler': 'Motorcycles/Scooters',
      pedestrian: 'Pedestrians',
      'car-taxi': 'Cars & Cabs',
      'auto-rickshaw': 'Auto-Rickshaws',
      'heavy-commercial': 'Trucks & Trailers',
      bus: 'Buses',
    };

    const vehicles = Array.from(vehicleCounts.entries())
      .map(([key, count]) => ({
        name: VEHICLE_NAMES[key] || key,
        value: count,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      hourCounts: hours,
      dayCounts: days,
      causeData: causes,
      vehicleData: vehicles,
    };
  }, [records]);

  const PIE_COLORS = ['#3b82f6', '#38bdf8', '#94a3b8', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-4">
      {/* Top Row: Hourly Area Chart & Causes Bar Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Hourly Trend (24 Hours) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Hourly Accident & Fatality Profile (24 Hours)
              </h4>
              <p className="text-xs text-slate-400">
                Lethal crashes peak heavily between 21:00 and 02:00 due to night speeding & low visibility
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Total Crashes
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Fatalities
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFatal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={2} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="fatal" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFatal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contributing Violations */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Primary Causative Violations & Factors
              </h4>
              <p className="text-xs text-slate-400">
                Overspeeding and reckless lane maneuvers dominate high-risk corridors
              </p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={causeData} layout="vertical" margin={{ top: 5, right: 10, left: 35, bottom: 0 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ background: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', color: '#f8fafc' }}
                />
                <Bar dataKey="crashes" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Vehicle Vulnerability & Day of Week */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Vulnerable Road User Exposure */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <Car className="h-4 w-4 text-blue-400" />
            Vehicular Vulnerability Breakdown
          </h4>
          <p className="text-xs text-slate-400 mb-2">
            Two-wheelers and pedestrians sustain ~72% of all fatal trauma
          </p>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {vehicleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', color: '#f8fafc' }}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  layout="horizontal"
                  verticalAlign="bottom"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of Week Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-blue-400" />
            Accident Volume by Day of Week
          </h4>
          <p className="text-xs text-slate-400 mb-2">
            Weekend nights exhibit elevated fatality severity despite lower total congestion
          </p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', color: '#f8fafc' }}
                />
                <Bar dataKey="crashes" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Total Crashes" />
                <Bar dataKey="fatal" fill="#f43f5e" radius={[3, 3, 0, 0]} name="Fatalities" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

