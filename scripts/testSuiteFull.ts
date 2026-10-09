import assert from 'assert';
import { runDBSCAN } from '../lib/analytics/dbscan';
import { computeClusterRiskScore } from '../lib/analytics/riskScorer';
import { simulateHotspotScenarioRisk } from '../lib/analytics/predictiveModel';
import { generateExplainableAiDiagnosis } from '../lib/analytics/xaiEngine';
import { normalizeUniversalCsvData } from '../lib/data/universalCsvNormalizer';
import Papa from 'papaparse';
import { generateAccidentDataset } from '../lib/data/datasetGenerator';
import { haversineDistanceMeters } from '../lib/analytics/haversine';
import { Hotspot, AccidentRecord, ScenarioState } from '../types/accidents';

console.log('🚀 Running SafeRoute AI Comprehensive Hackathon Test Suite...\n');

// ============================================================================
// SUITE 1: GEOSPATIAL & HAVERSINE MATHEMATICAL INTEGRITY
// ============================================================================
console.log('📌 Test Suite 1: Spherical Geospatial Math (Haversine)');
{
  // Known distance: Connaught Place (28.6315, 77.2167) to India Gate (28.6129, 77.2295) ~= 2.41 km
  const distMeters = haversineDistanceMeters(28.6315, 77.2167, 28.6129, 77.2295);
  assert(distMeters > 2300 && distMeters < 2500, `Haversine distance should be ~2410m, got ${distMeters}`);
  console.log(`  ✓ Haversine distance CP to India Gate: ${(distMeters / 1000).toFixed(2)} km (PASS)`);

  // Same point distance must be 0
  const zeroDist = haversineDistanceMeters(28.7041, 77.1025, 28.7041, 77.1025);
  assert(zeroDist === 0, 'Distance between identical points must be 0');
  console.log('  ✓ Identical coordinate distance: 0.00m (PASS)');
}

// ============================================================================
// SUITE 2: SPATIAL DBSCAN CLUSTERING & SPATIAL HASHING
// ============================================================================
console.log('\n📌 Test Suite 2: Spatial DBSCAN (MoRTH 500m Protocol)');
{
  const baseLat = 28.7291;
  const baseLng = 77.1764;

  // 10 tightly grouped accidents (within 150m of Mukundpur Chowk)
  const clusterRecords: AccidentRecord[] = Array.from({ length: 10 }, (_, i) => ({
    id: `C-${i}`,
    lat: baseLat + (i * 0.0002),
    lng: baseLng + (i * 0.0002),
    datetime: '2024-05-10T14:00:00Z',
    severity: 'fatal',
    vehicles_involved: 2,
    casualties: 1,
    cause: 'overspeeding',
    weather: 'clear',
    road_type: 'highway',
    light_condition: 'daylight',
    vehicle_type: 'two-wheeler',
    road_name: 'Outer Ring Road',
    is_simulated_attributes: false,
  }));

  // 1 noise record far away in Gurgaon (25 km away)
  const noiseRecord: AccidentRecord = {
    id: 'NOISE-1',
    lat: 28.4595,
    lng: 77.0266,
    datetime: '2024-05-10T14:00:00Z',
    severity: 'minor',
    vehicles_involved: 1,
    casualties: 0,
    cause: 'distracted-driving',
    weather: 'clear',
    road_type: 'arterial',
    light_condition: 'daylight',
    vehicle_type: 'car-taxi',
    road_name: 'MG Road Gurgaon',
    is_simulated_attributes: false,
  };

  const dbscanResult = runDBSCAN([...clusterRecords, noiseRecord], 450, 5);
  assert(dbscanResult.clusters.length === 1, `Expected exactly 1 cluster, got ${dbscanResult.clusters.length}`);
  assert(dbscanResult.noiseCount === 1, `Expected exactly 1 noise point, got ${dbscanResult.noiseCount}`);
  assert(dbscanResult.clusters[0].recordIds.length === 10, 'Cluster must contain all 10 grouped points');
  console.log(`  ✓ DBSCAN correctly isolated 1 dense cluster (${dbscanResult.clusters[0].recordIds.length} points) from 1 noise point (PASS)`);
}

// ============================================================================
// SUITE 3: MULTI-FACTOR RISK SCORING & SEVERITY WEIGHTING
// ============================================================================
console.log('\n📌 Test Suite 3: Multi-Factor Risk Scoring Monotonicity');
{
  const lethalRecords: AccidentRecord[] = Array.from({ length: 15 }, (_, i) => ({
    id: `L-${i}`,
    lat: 28.7291,
    lng: 77.1764,
    datetime: '2024-10-01T12:00:00Z',
    severity: 'fatal',
    vehicles_involved: 2,
    casualties: 2,
    cause: 'overspeeding',
    weather: 'rain',
    road_type: 'highway',
    light_condition: 'darkness-unlit',
    vehicle_type: 'pedestrian',
    road_name: 'Outer Ring Road',
    is_simulated_attributes: false,
  }));

  const minorRecords: AccidentRecord[] = Array.from({ length: 15 }, (_, i) => ({
    id: `M-${i}`,
    lat: 28.7291,
    lng: 77.1764,
    datetime: '2022-01-01T12:00:00Z',
    severity: 'minor',
    vehicles_involved: 1,
    casualties: 0,
    cause: 'distracted-driving',
    weather: 'clear',
    road_type: 'residential',
    light_condition: 'daylight',
    vehicle_type: 'car-taxi',
    road_name: 'Outer Ring Road',
    is_simulated_attributes: false,
  }));

  const lethalScore = computeClusterRiskScore(lethalRecords);
  const minorScore = computeClusterRiskScore(minorRecords);

  assert(lethalScore.totalScore >= 70, `Lethal score should be >= 70, got ${lethalScore.totalScore}`);
  assert(minorScore.totalScore < 40, `Minor score should be < 40, got ${minorScore.totalScore}`);
  assert(lethalScore.totalScore > minorScore.totalScore, 'Fatal cluster must strictly outscore minor cluster');
  assert(lethalScore.tier === 'Critical' || lethalScore.tier === 'High', 'Lethal cluster must be Critical/High tier');
  console.log(`  ✓ Lethal Score (${lethalScore.totalScore}/100 [${lethalScore.tier}]) > Minor Score (${minorScore.totalScore}/100 [${minorScore.tier}]) (PASS)`);
}

// ============================================================================
// SUITE 4: EXPLAINABLE AI (XAI) & SHAP FEATURE ATTRIBUTION INTEGRITY
// ============================================================================
console.log('\n📌 Test Suite 4: Explainable AI (XAI) Feature Attribution');
{
  const mockHotspot: Hotspot = {
    id: 'BS-MUKUNDPUR',
    name: 'Mukundpur Chowk (Outer Ring Road)',
    roadName: 'Outer Ring Road, NH-44 Crossing',
    centerLat: 28.7291,
    centerLng: 77.1764,
    radiusMeters: 280,
    incidentIds: ['1', '2', '3', '4', '5'],
    totalCrashes: 99,
    fatalCount: 44,
    grievousCount: 20,
    minorCount: 30,
    nonInjuryCount: 5,
    totalCasualties: 104,
    riskScore: 92,
    riskTier: 'Critical',
    whyDangerous: 'High fatal collisions driven by overspeeding and lack of pedestrian grade separation.',
    contributingFactors: {
      causes: [
        { label: 'Overspeeding', percentage: 46, count: 45, riskWeight: 1.4 },
        { label: 'Pedestrian Jaywalking', percentage: 28, count: 28, riskWeight: 1.3 },
      ],
      weather: [{ label: 'Clear', percentage: 70, count: 70, riskWeight: 1.0 }],
      light: [{ label: 'Darkness (Unlit)', percentage: 38, count: 38, riskWeight: 1.35 }],
      vehicles: [
        { label: 'Pedestrian', percentage: 36, count: 36, riskWeight: 1.5 },
        { label: 'Two-Wheeler', percentage: 32, count: 32, riskWeight: 1.4 },
      ],
      peakHours: [{ hour: 21, count: 18 }],
      daysOfWeek: [{ day: 'Saturday', count: 22 }],
    },
    recommendations: [
      {
        id: 'rec-1',
        title: 'Grade-Separated Pedestrian Foot Overbridge (FOB)',
        category: 'Pedestrian Safety',
        priority: 'Immediate',
        estimatedCost: '₹₹₹',
        expectedReductionPct: 45,
        livesSavedEstPerYear: 6,
        rationale: 'Grade-separated crossing eliminates direct human-vehicle conflicts.',
        timeframe: '3-6 Months',
      },
      {
        id: 'rec-2',
        title: 'Automated ANPR Speed Violation Cameras',
        category: 'Enforcement & Surveillance',
        priority: 'Immediate',
        estimatedCost: '₹₹',
        expectedReductionPct: 34,
        livesSavedEstPerYear: 4,
        rationale: 'Continuous radar enforcement suppresses approach speeds below 50 km/h.',
        timeframe: '1-2 Weeks',
      },
    ],
  };

  const xai = generateExplainableAiDiagnosis(mockHotspot);

  // 1. Total score integrity
  assert(xai.totalRiskScore === 92, `XAI score must match hotspot risk score (92), got ${xai.totalRiskScore}`);

  // 2. Feature attribution points sum verification
  const totalAttributedPoints = xai.featureAttributions.reduce((sum, f) => sum + f.points, 0);
  assert(
    totalAttributedPoints === 92,
    `Sum of XAI attribution points (${totalAttributedPoints}) must strictly equal total risk score (92)`
  );
  console.log(`  ✓ XAI SHAP Attribution sum strictly equals risk score: ${totalAttributedPoints}/92 pts (PASS)`);

  // 3. Countermeasure attribution exists and targets root causes
  assert(xai.prescriptionMappings.length === 2, 'Prescription mappings must evaluate all recommendations');
  assert(
    xai.prescriptionMappings[0].targetedFeatureId === 'vulnerable_trauma',
    'FOB must target vulnerable road user trauma'
  );
  console.log('  ✓ Prescriptive Countermeasure Mapping accurately links remedies to root causes (PASS)');

  // 4. Projected Residual Risk reduction
  assert(
    xai.projectedPostInterventionScore < xai.totalRiskScore,
    `Projected score (${xai.projectedPostInterventionScore}) must be strictly lower than initial score (92)`
  );
  assert(xai.livesSavedEstAnnual === 10, `Estimated lives saved must equal 10, got ${xai.livesSavedEstAnnual}`);
  console.log(`  ✓ Residual Risk Projection: 92/100 -> ${xai.projectedPostInterventionScore}/100 (-${xai.projectedReductionPct}% drop, 10 lives saved) (PASS)`);

  // 5. Statutory Tender Justification Note generation
  assert(xai.tenderJustificationText.includes('MoRTH Protocol'), 'Tender memo must cite statutory MoRTH Protocol');
  assert(xai.tenderJustificationText.includes('BS-MUKUNDPUR'), 'Tender memo must include Black Spot reference ID');
  console.log('  ✓ Statutory Government Administrative Sanction Memo generated cleanly (PASS)');
}

// ============================================================================
// SUITE 5: UNIVERSAL CSV NORMALIZER (PAN-INDIA MULTI-CITY INGESTION)
// ============================================================================
console.log('\n📌 Test Suite 5: Universal Pan-India CSV Normalizer');
{
  const rawCsv = `
Accident_ID,Latitude,Longitude,Date_Time,Severity_Level,Vehicle_Type,Cause_Description
PUN-001,18.5204,73.8567,2024-03-01 10:00:00,Fatal,Two-Wheeler,Overspeeding
PUN-002,18.5210,73.8570,2024-03-02 11:00:00,Fatal,Pedestrian,Jaywalking
PUN-003,18.5215,73.8575,2024-03-03 14:00:00,Grievous,Car,Red Light
DEL-001,28.7291,77.1764,2024-04-01 20:00:00,Fatal,Bus,Speeding
DEL-002,28.7295,77.1768,2024-04-02 21:00:00,Fatal,Two-Wheeler,Lane Indiscipline
DEL-003,28.7300,77.1770,2024-04-03 22:00:00,Grievous,Auto,Drunk Driving
  `.trim();

  const parsed = Papa.parse<Record<string, string>>(rawCsv, { header: true, skipEmptyLines: true });
  const normalized = normalizeUniversalCsvData(parsed.data);
  assert(normalized.records.length === 6, `Expected 6 normalized records, got ${normalized.records.length}`);
  assert(normalized.stats.isMultiCity === true, 'Must detect multiple cities across India');
  assert(normalized.stats.availableCities.length >= 2, 'Must identify Pune and Delhi clusters');
  console.log(`  ✓ Successfully parsed raw Indian CSV into ${normalized.stats.availableCities.length} distinct municipal clusters (PASS)`);
}

// ============================================================================
// SUITE 6: WHAT-IF POISSON SIMULATION ELASTICITIES
// ============================================================================
console.log('\n📌 Test Suite 6: Log-Linear Poisson Rate Elasticity Model');
{
  const testHotspot: Hotspot = {
    id: 'BS-TEST',
    name: 'Test Corridor',
    roadName: 'Arterial Ring',
    centerLat: 28.6,
    centerLng: 77.2,
    radiusMeters: 300,
    incidentIds: ['1', '2'],
    totalCrashes: 20,
    fatalCount: 8,
    grievousCount: 5,
    minorCount: 7,
    nonInjuryCount: 0,
    totalCasualties: 20,
    riskScore: 75,
    riskTier: 'Critical',
    whyDangerous: 'Test',
    contributingFactors: {
      causes: [],
      weather: [],
      light: [],
      vehicles: [],
      peakHours: [],
      daysOfWeek: [],
    },
    recommendations: [],
  };

  const fogScenario: ScenarioState = {
    timeOfDay: 'night',
    weather: 'winter-fog',
    dayType: 'weekend',
    speedEnforcement: 'low',
  };

  const strictScenario: ScenarioState = {
    timeOfDay: 'day',
    weather: 'clear',
    dayType: 'weekday',
    speedEnforcement: 'strict',
  };

  const fogRes = simulateHotspotScenarioRisk(testHotspot, fogScenario);
  const strictRes = simulateHotspotScenarioRisk(testHotspot, strictScenario);

  assert(fogRes.isWorsened === true, 'Adverse fog+night scenario must worsen baseline risk');
  assert(fogRes.scenarioScore > testHotspot.riskScore, 'Adverse scenario score must exceed baseline score');
  assert(strictRes.scenarioScore < testHotspot.riskScore, 'Strict enforcement must reduce projected risk score');
  console.log(`  ✓ Poisson Elasticity: Fog/Night increases risk to ${fogRes.scenarioScore}/100 (+${fogRes.deltaPercentage}%), Strict Radar reduces to ${strictRes.scenarioScore}/100 (${strictRes.deltaPercentage}%) (PASS)`);
}

console.log('\n============================================================');
console.log('🏆 100% OF EXTENDED HACKATHON TEST SUITES PASSED FLAWLESSLY!');
console.log('============================================================\n');
