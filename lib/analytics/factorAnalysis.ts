import { AccidentRecord, FactorBreakdown } from '@/types/accidents';

export interface HotspotFactorAnalysis {
  causes: FactorBreakdown[];
  weather: FactorBreakdown[];
  light: FactorBreakdown[];
  vehicles: FactorBreakdown[];
  roadTypes: FactorBreakdown[];
  peakHours: { hour: number; count: number }[];
  daysOfWeek: { day: string; count: number }[];
  primaryCause: string;
  primaryLight: string;
  primaryVehicle: string;
  primaryRoadType: string;
  whyDangerous: string;
}

const CAUSE_LABELS: Record<string, string> = {
  overspeeding: 'Overspeeding / Reckless Driving',
  'drunk-driving': 'Drunk / Impaired Driving',
  'red-light-jumping': 'Red Light Violation',
  'distracted-driving': 'Distracted Driving (Mobile Phone)',
  'wrong-side-driving': 'Wrong-Side Driving',
  'poor-visibility': 'Severe Poor Visibility (Fog/Smog)',
  'lane-indiscipline': 'Aggressive Lane Cutting',
  'pedestrian-jaywalking': 'Unprotected Pedestrian Crossing',
};

const VEHICLE_LABELS: Record<string, string> = {
  'two-wheeler': 'Motorcycles & Scooters',
  pedestrian: 'Pedestrians',
  'car-taxi': 'Cars & Cabs',
  'auto-rickshaw': 'Auto-Rickshaws',
  'heavy-commercial': 'Heavy Trucks & Trailers',
  bus: 'DTC & Cluster Buses',
};

const LIGHT_LABELS: Record<string, string> = {
  daylight: 'Full Daylight',
  'darkness-lit': 'Night (Street Lit)',
  'darkness-unlit': 'Night (Unlit / Pitch Dark)',
  'dusk-dawn': 'Twilight (Dusk / Dawn)',
};

const WEATHER_LABELS: Record<string, string> = {
  clear: 'Clear Weather',
  fog: 'Dense Winter Fog',
  rain: 'Monsoon Rain & Wet Asphalt',
  overcast: 'Overcast Skies',
  smog: 'Severe Winter Smog',
};

function computeBreakdown<T extends string>(
  items: T[],
  labelMap: Record<string, string>
): FactorBreakdown[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  const total = items.length || 1;
  const result: FactorBreakdown[] = [];

  counts.forEach((count, key) => {
    const pct = Math.round((count / total) * 100);
    result.push({
      label: labelMap[key] || key,
      percentage: pct,
      count,
      riskWeight: pct,
    });
  });

  return result.sort((a, b) => b.count - a.count);
}

/**
 * Analyzes contributing risk factors and generates plain-language causality explanation.
 */
export function analyzeContributingFactors(
  records: AccidentRecord[],
  hotspotName?: string
): HotspotFactorAnalysis {
  const total = records.length;
  if (total === 0) {
    return {
      causes: [],
      weather: [],
      light: [],
      vehicles: [],
      roadTypes: [],
      peakHours: [],
      daysOfWeek: [],
      primaryCause: 'None',
      primaryLight: 'None',
      primaryVehicle: 'None',
      primaryRoadType: 'None',
      whyDangerous: 'Insufficient accident records to generate causal analysis.',
    };
  }

  // Breakdowns
  const causes = computeBreakdown(records.map(r => r.cause), CAUSE_LABELS);
  const weather = computeBreakdown(records.map(r => r.weather), WEATHER_LABELS);
  const light = computeBreakdown(records.map(r => r.light_condition), LIGHT_LABELS);
  const vehicles = computeBreakdown(records.map(r => r.vehicle_type), VEHICLE_LABELS);
  const roadTypes = computeBreakdown(records.map(r => r.road_type), {
    highway: 'Expressway / Highway',
    'flyover-approach': 'Flyover Approach / Ramp',
    junction: 'Signalized / Unsignalized Junction',
    arterial: 'Major Arterial Road',
    residential: 'Local Collector / Residential',
  });

  // Peak Hours (24 hours)
  const hourCounts = new Array(24).fill(0);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = new Array(7).fill(0);

  let nightUnlitCount = 0;
  let fatalCount = 0;
  let twoWheelerOrPedCount = 0;

  for (const r of records) {
    const d = new Date(r.datetime);
    const h = d.getUTCHours();
    const day = d.getUTCDay();
    hourCounts[h]++;
    dayCounts[day]++;

    if (r.severity === 'fatal') fatalCount++;
    if (r.light_condition === 'darkness-unlit' || r.light_condition === 'darkness-lit') {
      if (h >= 20 || h <= 4) nightUnlitCount++;
    }
    if (r.vehicle_type === 'two-wheeler' || r.vehicle_type === 'pedestrian') {
      twoWheelerOrPedCount++;
    }
  }

  const peakHours = hourCounts.map((count, hour) => ({ hour, count }));
  const daysOfWeek = dayCounts.map((count, idx) => ({ day: dayNames[idx], count }));

  // Find peak hour block
  let maxHourCount = 0;
  let peakHour = 20;
  for (let h = 0; h < 24; h++) {
    if (hourCounts[h] > maxHourCount) {
      maxHourCount = hourCounts[h];
      peakHour = h;
    }
  }

  const topCause = causes[0]?.label || 'Speeding';
  const topCausePct = causes[0]?.percentage || 0;
  const topVehicle = vehicles[0]?.label || 'Two-Wheelers';
  const vulnerablePct = Math.round((twoWheelerOrPedCount / total) * 100);
  const nightCrashPct = Math.round((nightUnlitCount / total) * 100);

  // Generate plain-language "Why is this location dangerous?" narrative
  const peakTimeStr = `${peakHour.toString().padStart(2, '0')}:00 - ${((peakHour + 2) % 24).toString().padStart(2, '0')}:00`;
  const namePrefix = hotspotName ? `At ${hotspotName}, ` : 'This corridor is dangerous because ';

  let whyDangerous = `${namePrefix}crashes peak heavily during ${peakTimeStr} driven by ${topCause.toLowerCase()} (${topCausePct}% of incidents), with ${fatalCount} fatalities recorded. `;
  
  if (vulnerablePct >= 50) {
    whyDangerous += `Vulnerable road users (${topVehicle} & pedestrians) suffer ${vulnerablePct}% of all trauma, compounded by `;
  } else {
    whyDangerous += `Heavy vehicular mix and speed differentials cause severe conflicts, exacerbated by `;
  }

  if (nightCrashPct >= 35) {
    whyDangerous += `insufficient night-time visibility and inadequate pedestrian crossing refuge.`;
  } else {
    whyDangerous += `inadequate geometric deceleration zones and aggressive merging behavior.`;
  }

  return {
    causes,
    weather,
    light,
    vehicles,
    roadTypes,
    peakHours,
    daysOfWeek,
    primaryCause: causes[0]?.label || 'Overspeeding',
    primaryLight: light[0]?.label || 'Daylight',
    primaryVehicle: vehicles[0]?.label || 'Two-Wheelers',
    primaryRoadType: roadTypes[0]?.label || 'Junction',
    whyDangerous,
  };
}
