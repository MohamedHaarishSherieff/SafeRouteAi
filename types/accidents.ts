export type SeverityLevel = 'fatal' | 'grievous' | 'minor' | 'non-injury';

export type RoadType = 'highway' | 'arterial' | 'junction' | 'residential' | 'flyover-approach';

export type WeatherCondition = 'clear' | 'fog' | 'rain' | 'overcast' | 'smog';

export type LightCondition = 'daylight' | 'darkness-lit' | 'darkness-unlit' | 'dusk-dawn';

export type AccidentCause =
  | 'overspeeding'
  | 'drunk-driving'
  | 'red-light-jumping'
  | 'distracted-driving'
  | 'wrong-side-driving'
  | 'poor-visibility'
  | 'lane-indiscipline'
  | 'pedestrian-jaywalking';

export type VehicleType =
  | 'two-wheeler'
  | 'pedestrian'
  | 'car-taxi'
  | 'auto-rickshaw'
  | 'heavy-commercial'
  | 'bus';

export type RiskTier = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AccidentRecord {
  id: string;
  lat: number;
  lng: number;
  datetime: string; // ISO string e.g. "2023-11-14T20:30:00Z"
  severity: SeverityLevel;
  vehicles_involved: number;
  casualties: number;
  cause: AccidentCause;
  weather: WeatherCondition;
  road_type: RoadType;
  light_condition: LightCondition;
  vehicle_type: VehicleType;
  road_name: string;
  city?: string;
  state?: string;
  is_simulated_attributes: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  category: 'Civil Engineering' | 'Traffic Control' | 'Lighting & Visibility' | 'Enforcement & Surveillance' | 'Pedestrian Safety';
  priority: 'Immediate' | 'High' | 'Medium';
  estimatedCost: '₹' | '₹₹' | '₹₹₹';
  expectedReductionPct: number;
  livesSavedEstPerYear: number;
  rationale: string;
  timeframe: '1-2 Weeks' | '1-3 Months' | '3-6 Months';
}

export interface FactorBreakdown {
  label: string;
  percentage: number;
  count: number;
  riskWeight: number;
}

export interface Hotspot {
  id: string;
  name: string;
  roadName: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  incidentIds: string[];
  totalCrashes: number;
  fatalCount: number;
  grievousCount: number;
  minorCount: number;
  nonInjuryCount: number;
  totalCasualties: number;
  riskScore: number; // 0 - 100
  riskTier: RiskTier;
  whyDangerous: string;
  contributingFactors: {
    causes: FactorBreakdown[];
    weather: FactorBreakdown[];
    light: FactorBreakdown[];
    vehicles: FactorBreakdown[];
    peakHours: { hour: number; count: number }[];
    daysOfWeek: { day: string; count: number }[];
  };
  recommendations: Recommendation[];
  officialAnchorMatch?: {
    officialName: string;
    distanceMeters: number;
    officialFatal: number;
    officialTotal: number;
    detectedByRule: boolean;
  };
  predictedScenarioDelta?: {
    scenarioScore: number;
    deltaPercentage: number;
    isWorsened: boolean;
  };
}

export interface OfficialBlackSpot {
  id: string;
  name: string;
  road: string;
  circle: string;
  fatal: number;
  simple: number;
  total: number;
  lat: number;
  lng: number;
  source: string;
}

export interface ValidationSummary {
  officialSpotsCount: number;
  aiHotspotsCount: number;
  truePositivesMatched: number;
  officialMissedByRuleButFoundByAI: number;
  aiDiscoveredEmergingHotspots: number;
  precision: number;
  recall: number;
  f1Score: number;
  comparisons: Array<{
    name: string;
    officialFatal: number;
    officialTotal: number;
    aiRank: number | null;
    aiRiskScore: number | null;
    aiDetected: boolean;
    ruleDetected: boolean;
    status: 'Matched (AI+Rule)' | 'AI-Only (Emerging)' | 'Rule-Only' | 'Missed Both';
    notes: string;
  }>;
}

export interface FilterState {
  searchQuery: string;
  city?: string | 'all';
  severity: SeverityLevel | 'all';
  cause: AccidentCause | 'all';
  weather: WeatherCondition | 'all';
  roadType: RoadType | 'all';
  vehicleType: VehicleType | 'all';
  timeOfDay: 'all' | 'morning-rush' | 'afternoon' | 'evening-rush' | 'night' | 'late-night';
  minRiskTier: 'all' | 'Critical' | 'High' | 'Medium' | 'Low';
  startDate: string;
  endDate: string;
}

export interface ScenarioState {
  timeOfDay: 'day' | 'night' | 'fog-morning';
  weather: 'clear' | 'heavy-rain' | 'winter-fog' | 'smog-haze';
  dayType: 'weekday' | 'weekend';
  speedEnforcement: 'low' | 'normal' | 'strict';
}

export interface KPIStats {
  totalAccidents: number;
  fatalities: number;
  grievousInjuries: number;
  totalCasualties: number;
  criticalHotspotsCount: number;
  highHotspotsCount: number;
  highestRiskHotspotName: string;
  highestRiskScore: number;
  predominantCause: string;
  mostVulnerableRoadType: string;
}
