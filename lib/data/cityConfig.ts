export interface CityConfig {
  id: string;
  name: string;
  displayName: string;
  state: string;
  country: string;
  center: [number, number]; // [lat, lng]
  defaultZoom: number;
  bounds: [[number, number], [number, number]]; // [[minLat, minLng], [maxLat, maxLng]]
  authorities: string;
  blackSpotThresholds: {
    minFatalForBlackSpot: number;
    minTotalForBlackSpot: number;
    searchRadiusMeters: number;
  };
  policeControlRooms: number;
  speedLimits: {
    highway: number;
    arterial: number;
    junction: number;
    residential: number;
  };
}

export const DELHI_CONFIG: CityConfig = {
  id: 'delhi',
  name: 'Delhi NCR',
  displayName: 'National Capital Territory of Delhi',
  state: 'Delhi',
  country: 'India',
  center: [28.6328, 77.2197],
  defaultZoom: 11,
  bounds: [
    [28.40, 76.84],
    [28.88, 77.38],
  ],
  authorities: 'Delhi Traffic Police & Public Works Department (PWD)',
  blackSpotThresholds: {
    minFatalForBlackSpot: 3, // MoRTH & Delhi Police standard: 3+ fatal in 500m
    minTotalForBlackSpot: 10, // or 10+ total crashes in 500m
    searchRadiusMeters: 500,
  },
  policeControlRooms: 112,
  speedLimits: {
    highway: 70,
    arterial: 50,
    junction: 30,
    residential: 30,
  },
};

export const ACTIVE_CITY = DELHI_CONFIG;
