import { AccidentRecord, SeverityLevel, AccidentCause, WeatherCondition, LightCondition, VehicleType, RoadType } from '@/types/accidents';
import { DELHI_OFFICIAL_BLACKSPOTS } from './officialBlackSpots';

// Seeded pseudorandom generator for deterministic, repeatable dataset generation
class SeededRNG {
  private seed: number;
  constructor(seed: number = 42) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  choice<T>(items: T[], weights?: number[]): T {
    if (!weights) {
      return items[Math.floor(this.next() * items.length)];
    }
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      if (r < weights[i]) return items[i];
      r -= weights[i];
    }
    return items[items.length - 1];
  }
  gaussian(mean = 0, stdev = 1): number {
    const u1 = 1 - this.next();
    const u2 = 1 - this.next();
    const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    return mean + stdev * randStdNormal;
  }
}

/**
 * Realistic Indian Road Safety distributions (MoRTH Delhi Profile):
 * - Overspeeding: 58-65%
 * - Drunk driving: 8-12% (peaks 10 PM - 3 AM)
 * - Two-wheelers: 42% of fatal crashes
 * - Pedestrians: 36% of fatal crashes
 * - Heavy commercials: 14% of crashes, high lethality
 * - Winter fog in Dec-Jan: 4x risk multiplier
 */
export function generateAccidentDataset(): AccidentRecord[] {
  const rng = new SeededRNG(20261009);
  const records: AccidentRecord[] = [];
  let recordIdCounter = 1;

  // 1. Generate crashes clustered around Real Delhi Official Black Spots
  for (const spot of DELHI_OFFICIAL_BLACKSPOTS) {
    // Determine number of historical incidents for this hotspot (100 - 180 records per high-risk spot over 3 years)
    const clusterMultiplier = 6.5;
    const fatalTarget = Math.round(spot.fatal * clusterMultiplier);
    const nonFatalTarget = Math.round(spot.simple * clusterMultiplier);

    const generateSpotCrash = (isFatalTarget: boolean) => {
      // Gaussian jitter within ~150m - 400m along road corridor
      // 1 deg lat ~= 111km -> 100m ~= 0.0009 deg
      const jitterLat = rng.gaussian(0, 0.0018);
      const jitterLng = rng.gaussian(0, 0.0018);
      const lat = Number((spot.lat + jitterLat).toFixed(6));
      const lng = Number((spot.lng + jitterLng).toFixed(6));

      // Date across 2021 to 2024
      const year = rng.choice([2021, 2022, 2023, 2024], [15, 25, 35, 25]);
      const month = Math.floor(rng.range(0, 12));
      const day = Math.floor(rng.range(1, 28));

      // Hourly distribution: Peak morning (8-11 AM) and Evening/Night (6-11 PM, 11PM-2AM)
      const hourWeights = [
        3, 3, 2, 2, 2, 3, // 00 - 05
        5, 7, 8, 7, 5, 5, // 06 - 11 (morning rush)
        5, 5, 5, 6, 7, 9, // 12 - 17
        10, 10, 9, 8, 6, 4 // 18 - 23 (evening/night peak)
      ];
      const hour = rng.choice(Array.from({ length: 24 }, (_, i) => i), hourWeights);
      const minute = Math.floor(rng.range(0, 60));
      const date = new Date(Date.UTC(year, month, day, hour, minute));

      // Light condition
      let light: LightCondition = 'daylight';
      if (hour >= 20 || hour < 5) {
        light = rng.choice(['darkness-unlit', 'darkness-lit'], [35, 65]);
      } else if (hour >= 5 && hour < 7 || hour >= 18 && hour < 20) {
        light = 'dusk-dawn';
      }

      // Weather condition (Delhi winter fog in Dec/Jan, monsoon in Jul/Aug)
      let weather: WeatherCondition = 'clear';
      if ((month === 11 || month === 0) && (hour >= 22 || hour <= 8)) {
        weather = rng.choice(['fog', 'smog', 'clear'], [55, 30, 15]);
      } else if (month === 6 || month === 7) {
        weather = rng.choice(['rain', 'overcast', 'clear'], [45, 25, 30]);
      } else if (month === 9 || month === 10) {
        weather = rng.choice(['smog', 'clear'], [40, 60]);
      }

      // Cause distribution
      let cause: AccidentCause;
      if (hour >= 22 || hour <= 3) {
        cause = rng.choice(
          ['overspeeding', 'drunk-driving', 'lane-indiscipline', 'poor-visibility'],
          [45, 30, 15, 10]
        );
      } else if (weather === 'fog' || weather === 'smog') {
        cause = rng.choice(
          ['poor-visibility', 'overspeeding', 'wrong-side-driving', 'lane-indiscipline'],
          [45, 30, 15, 10]
        );
      } else {
        cause = rng.choice(
          ['overspeeding', 'red-light-jumping', 'distracted-driving', 'pedestrian-jaywalking', 'wrong-side-driving'],
          [52, 16, 12, 12, 8]
        );
      }

      // Vehicle type (Two-wheelers & Pedestrians suffer highest casualty)
      const vehicle: VehicleType = rng.choice(
        ['two-wheeler', 'pedestrian', 'car-taxi', 'auto-rickshaw', 'heavy-commercial', 'bus'],
        [38, 26, 16, 10, 7, 3]
      );

      // Severity
      let severity: SeverityLevel;
      if (isFatalTarget) {
        severity = 'fatal';
      } else {
        severity = rng.choice(
          ['grievous', 'minor', 'non-injury'],
          [45, 40, 15]
        );
      }

      // Road type
      let roadType: RoadType = 'junction';
      if (spot.road.toLowerCase().includes('outer ring') || spot.road.toLowerCase().includes('highway') || spot.road.toLowerCase().includes('nh-')) {
        roadType = rng.choice(['highway', 'flyover-approach', 'junction'], [50, 25, 25]);
      } else if (spot.road.toLowerCase().includes('ring road')) {
        roadType = rng.choice(['arterial', 'flyover-approach', 'junction'], [45, 30, 25]);
      }

      const vehiclesInvolved = rng.choice([1, 2, 3, 4], [25, 60, 12, 3]);
      const casualties = severity === 'fatal' 
        ? rng.choice([1, 2, 3], [85, 12, 3]) 
        : severity === 'grievous' 
          ? rng.choice([1, 2, 3], [70, 22, 8]) 
          : rng.choice([0, 1], [40, 60]);

      records.push({
        id: `DL-${year}-${String(recordIdCounter++).padStart(5, '0')}`,
        lat,
        lng,
        datetime: date.toISOString(),
        severity,
        vehicles_involved: vehiclesInvolved,
        casualties,
        cause,
        weather,
        road_type: roadType,
        light_condition: light,
        vehicle_type: vehicle,
        road_name: spot.road.split('(')[0].trim(),
        is_simulated_attributes: true,
      });
    };

    for (let i = 0; i < fatalTarget; i++) generateSpotCrash(true);
    for (let i = 0; i < nonFatalTarget; i++) generateSpotCrash(false);
  }

  // 2. Add background scattered crashes across Delhi NCR corridors
  // (Ensures DBSCAN & KDE clustering does real work separating noise from true hotspots)
  const backgroundCorridors = [
    { name: 'Vikas Marg (Laxmi Nagar / Preet Vihar)', lat: 28.6360, lng: 77.2880, count: 65 },
    { name: 'Mathura Road (Badarpur Border Corridor)', lat: 28.5020, lng: 77.3010, count: 80 },
    { name: 'Mehrauli-Gurgaon Road (Sultanpur - Ghitorni)', lat: 28.5025, lng: 77.1420, count: 70 },
    { name: 'Najafgarh Road (Uttam Nagar - Janakpuri)', lat: 28.6210, lng: 77.0720, count: 75 },
    { name: 'Narela-Alipur Road', lat: 28.8450, lng: 77.1050, count: 50 },
    { name: 'GT Road (Shahdara - Dilshad Garden)', lat: 28.6780, lng: 77.3080, count: 60 },
    { name: 'Rohtak Road (Nangloi - Mundka)', lat: 28.6830, lng: 77.0320, count: 85 },
    { name: 'Dwarka Expressway / Sector 21 Junction', lat: 28.5530, lng: 77.0540, count: 55 },
    { name: 'Wazirabad Road (Yamuna Vihar - Bhajanpura)', lat: 28.7050, lng: 77.2720, count: 65 },
    { name: 'Barapullah Corridor / Sarai Kale Khan', lat: 28.5870, lng: 77.2580, count: 60 },
    { name: 'Kanjhawala Road (Rohini Sec 22 - Begumpur)', lat: 28.7250, lng: 77.0620, count: 55 },
    { name: 'Kapashera Border / Bijwasan Road', lat: 28.5180, lng: 77.0850, count: 50 },
  ];

  for (const corridor of backgroundCorridors) {
    for (let i = 0; i < corridor.count; i++) {
      const lat = Number((corridor.lat + rng.gaussian(0, 0.008)).toFixed(6));
      const lng = Number((corridor.lng + rng.gaussian(0, 0.008)).toFixed(6));
      const year = rng.choice([2021, 2022, 2023, 2024], [20, 25, 30, 25]);
      const month = Math.floor(rng.range(0, 12));
      const day = Math.floor(rng.range(1, 28));
      const hour = Math.floor(rng.range(0, 24));
      const minute = Math.floor(rng.range(0, 60));
      const date = new Date(Date.UTC(year, month, day, hour, minute));

      const isFatal = rng.next() < 0.18;
      const severity: SeverityLevel = isFatal
        ? 'fatal'
        : rng.choice(['grievous', 'minor', 'non-injury'], [40, 45, 15]);

      records.push({
        id: `DL-${year}-${String(recordIdCounter++).padStart(5, '0')}`,
        lat,
        lng,
        datetime: date.toISOString(),
        severity,
        vehicles_involved: rng.choice([1, 2, 3], [30, 60, 10]),
        casualties: isFatal ? 1 : rng.choice([0, 1], [50, 50]),
        cause: rng.choice(
          ['overspeeding', 'distracted-driving', 'red-light-jumping', 'wrong-side-driving'],
          [55, 20, 15, 10]
        ),
        weather: rng.choice(['clear', 'overcast', 'rain', 'fog'], [65, 15, 12, 8]),
        road_type: rng.choice(['arterial', 'highway', 'junction', 'residential'], [40, 30, 20, 10]),
        light_condition: hour >= 20 || hour < 5 ? 'darkness-lit' : 'daylight',
        vehicle_type: rng.choice(['two-wheeler', 'car-taxi', 'auto-rickshaw', 'pedestrian', 'bus'], [40, 30, 15, 10, 5]),
        road_name: corridor.name,
        is_simulated_attributes: true,
      });
    }
  }

  // 3. Add random uniform noise across Delhi bounds (~300 random points)
  for (let i = 0; i < 300; i++) {
    const lat = Number(rng.range(28.45, 28.82).toFixed(6));
    const lng = Number(rng.range(76.95, 77.32).toFixed(6));
    const year = rng.choice([2021, 2022, 2023, 2024]);
    const month = Math.floor(rng.range(0, 12));
    const day = Math.floor(rng.range(1, 28));
    const hour = Math.floor(rng.range(0, 24));
    const date = new Date(Date.UTC(year, month, day, hour, 0));

    records.push({
      id: `DL-${year}-${String(recordIdCounter++).padStart(5, '0')}`,
      lat,
      lng,
      datetime: date.toISOString(),
      severity: rng.choice(['fatal', 'grievous', 'minor', 'non-injury'], [12, 35, 38, 15]),
      vehicles_involved: rng.choice([1, 2], [40, 60]),
      casualties: rng.choice([0, 1], [60, 40]),
      cause: rng.choice(['overspeeding', 'distracted-driving', 'lane-indiscipline'], [60, 25, 15]),
      weather: 'clear',
      road_type: 'arterial',
      light_condition: hour >= 20 || hour < 5 ? 'darkness-lit' : 'daylight',
      vehicle_type: rng.choice(['two-wheeler', 'car-taxi', 'auto-rickshaw'], [50, 30, 20]),
      road_name: 'Delhi Municipal Road',
      is_simulated_attributes: true,
    });
  }

  return records;
}

/**
 * Format records to CSV string adhering to specification
 */
export function convertToCSV(records: AccidentRecord[]): string {
  const header = [
    'id',
    'lat',
    'lng',
    'datetime',
    'severity',
    'vehicles_involved',
    'casualties',
    'cause',
    'weather',
    'road_type',
    'light_condition',
    'vehicle_type',
    'road_name',
    'is_simulated_attributes',
  ].join(',');

  const rows = records.map(r => [
    r.id,
    r.lat,
    r.lng,
    r.datetime,
    r.severity,
    r.vehicles_involved,
    r.casualties,
    r.cause,
    r.weather,
    r.road_type,
    r.light_condition,
    r.vehicle_type,
    `"${r.road_name.replace(/"/g, '""')}"`,
    r.is_simulated_attributes,
  ].join(','));

  return [header, ...rows].join('\n');
}
