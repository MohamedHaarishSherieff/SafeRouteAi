import { haversineDistanceMeters } from '../lib/analytics/haversine';
import { runDBSCAN } from '../lib/analytics/dbscan';
import { computeClusterRiskScore } from '../lib/analytics/riskScorer';
import { simulateHotspotScenarioRisk } from '../lib/analytics/predictiveModel';
import { runValidationAnalysis } from '../lib/analytics/validationEngine';
import { generateAccidentDataset } from '../lib/data/datasetGenerator';
import { DELHI_OFFICIAL_BLACKSPOTS } from '../lib/data/officialBlackSpots';
import { AccidentRecord, Hotspot } from '../types/accidents';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

async function runTests() {
  console.log('🧪 Starting SafeRoute AI Analytics Engine Unit Tests...\n');

  // Test 1: Haversine distance accuracy
  console.log('Test 1: Haversine Geographic Distance');
  // Connaught Place (28.6328, 77.2197) to India Gate (28.6129, 77.2295) is approx 2.4 km
  const dist = haversineDistanceMeters(28.6328, 77.2197, 28.6129, 77.2295);
  assert(dist > 2200 && dist < 2600, `CP to India Gate distance should be ~2.4km (got ${(dist / 1000).toFixed(2)}km)`);

  // Test 2: DBSCAN clustering
  console.log('\nTest 2: Spatial DBSCAN Clustering');
  const dummyCluster1: AccidentRecord[] = Array.from({ length: 10 }, (_, i) => ({
    id: `c1-${i}`,
    lat: 28.7285 + (i * 0.0005),
    lng: 77.1772 + (i * 0.0005),
    datetime: '2023-05-10T12:00:00Z',
    severity: 'fatal',
    vehicles_involved: 2,
    casualties: 1,
    cause: 'overspeeding',
    weather: 'clear',
    road_type: 'highway',
    light_condition: 'daylight',
    vehicle_type: 'two-wheeler',
    road_name: 'Test Road',
    is_simulated_attributes: true,
  }));

  const dummyNoise: AccidentRecord = {
    id: 'noise-1',
    lat: 28.1000, // Very far south
    lng: 76.5000,
    datetime: '2023-05-10T12:00:00Z',
    severity: 'minor',
    vehicles_involved: 1,
    casualties: 0,
    cause: 'distracted-driving',
    weather: 'clear',
    road_type: 'residential',
    light_condition: 'daylight',
    vehicle_type: 'car-taxi',
    road_name: 'Far Rural Road',
    is_simulated_attributes: true,
  };

  const dbscanResult = runDBSCAN([...dummyCluster1, dummyNoise], 450, 5);
  assert(dbscanResult.clusters.length === 1, `DBSCAN should find exactly 1 cluster (got ${dbscanResult.clusters.length})`);
  assert(dbscanResult.noiseCount === 1, `DBSCAN should classify far point as noise (got ${dbscanResult.noiseCount})`);

  // Test 3: Transparent Multi-Factor Risk Scoring
  console.log('\nTest 3: Risk Scoring Bounds & Severity Sensitivity');
  const lethalCluster = dummyCluster1;
  const lethalScore = computeClusterRiskScore(lethalCluster);

  const minorCluster: AccidentRecord[] = Array.from({ length: 10 }, (_, i) => ({
    ...dummyCluster1[i],
    severity: 'minor',
    casualties: 0,
    road_type: 'residential',
  }));
  const minorScore = computeClusterRiskScore(minorCluster);

  assert(lethalScore.totalScore >= 1 && lethalScore.totalScore <= 100, `Lethal risk score within [1, 100] (got ${lethalScore.totalScore})`);
  assert(minorScore.totalScore >= 1 && minorScore.totalScore <= 100, `Minor risk score within [1, 100] (got ${minorScore.totalScore})`);
  assert(lethalScore.totalScore > minorScore.totalScore, `Lethal cluster score (${lethalScore.totalScore}) must exceed minor cluster score (${minorScore.totalScore})`);
  assert(lethalScore.tier === 'Critical' || lethalScore.tier === 'High', `Lethal cluster classified as High or Critical`);

  // Test 4: Predictive Scenario Poisson Rate Model
  console.log('\nTest 4: What-If Predictive Scenario Simulator');
  const dummyHotspot: Hotspot = {
    id: 'hs-test',
    name: 'Mukundpur Chowk',
    roadName: 'Outer Ring Road',
    centerLat: 28.7285,
    centerLng: 77.1772,
    radiusMeters: 350,
    incidentIds: ['c1-1'],
    totalCrashes: 26,
    fatalCount: 10,
    grievousCount: 12,
    minorCount: 4,
    nonInjuryCount: 0,
    totalCasualties: 18,
    riskScore: 78,
    riskTier: 'Critical',
    whyDangerous: 'High speed night corridor',
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

  // Adverse scenario: Night + Winter Fog + Low enforcement
  const adverseScenario = simulateHotspotScenarioRisk(dummyHotspot, {
    timeOfDay: 'night',
    weather: 'winter-fog',
    dayType: 'weekend',
    speedEnforcement: 'low',
  });
  assert(adverseScenario.isWorsened, `Adverse fog+night scenario must worsen risk`);
  assert(adverseScenario.scenarioScore > dummyHotspot.riskScore, `Scenario score (${adverseScenario.scenarioScore}) must exceed baseline (${dummyHotspot.riskScore})`);

  // Protective scenario: Day + Clear + Strict ANPR enforcement
  const protectiveScenario = simulateHotspotScenarioRisk(dummyHotspot, {
    timeOfDay: 'day',
    weather: 'clear',
    dayType: 'weekday',
    speedEnforcement: 'strict',
  });
  assert(!protectiveScenario.isWorsened, `Protective strict enforcement scenario must not worsen risk`);
  assert(protectiveScenario.scenarioScore < dummyHotspot.riskScore, `Strict enforcement must reduce projected risk score (got ${protectiveScenario.scenarioScore})`);

  // Test 5: Validation Benchmark Engine
  console.log('\nTest 5: Validation against Official Delhi Police Anchors');
  const fullDataset = generateAccidentDataset();
  const clusters = runDBSCAN(fullDataset, 450, 6);
  assert(clusters.clusters.length >= 15, `DBSCAN must detect clusters across Delhi (got ${clusters.clusters.length})`);

  const mockHotspots: Hotspot[] = clusters.clusters.map((c, i) => ({
    id: `hs-${i}`,
    name: `Cluster ${i}`,
    roadName: 'Delhi Corridor',
    centerLat: c.centroidLat,
    centerLng: c.centroidLng,
    radiusMeters: c.radiusMeters,
    incidentIds: c.recordIds,
    totalCrashes: c.recordIds.length,
    fatalCount: Math.round(c.recordIds.length * 0.25),
    grievousCount: Math.round(c.recordIds.length * 0.45),
    minorCount: Math.round(c.recordIds.length * 0.3),
    nonInjuryCount: 0,
    totalCasualties: Math.round(c.recordIds.length * 0.5),
    riskScore: 75,
    riskTier: 'Critical',
    whyDangerous: 'High density corridor',
    contributingFactors: {
      causes: [],
      weather: [],
      light: [],
      vehicles: [],
      peakHours: [],
      daysOfWeek: [],
    },
    recommendations: [],
  }));

  const validation = runValidationAnalysis(mockHotspots, DELHI_OFFICIAL_BLACKSPOTS);
  assert(validation.officialSpotsCount === 20, `Validation evaluated all 20 official DTP blackspots`);
  assert(validation.truePositivesMatched >= 18, `AI Hotspots must match at least 18/20 official DTP anchors (got ${validation.truePositivesMatched})`);
  assert(validation.recall >= 0.90, `Anchor recall must be >= 90% (got ${(validation.recall * 100).toFixed(0)}%)`);

  console.log('\n🎉 ALL 5 UNIT TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch(console.error);
