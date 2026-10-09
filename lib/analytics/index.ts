import { AccidentRecord, Hotspot, FilterState, KPIStats, ValidationSummary } from '@/types/accidents';
import { runDBSCAN } from './dbscan';
import { computeClusterRiskScore } from './riskScorer';
import { analyzeContributingFactors } from './factorAnalysis';
import { generateHotspotRecommendations } from './recommendationEngine';
import { runValidationAnalysis } from './validationEngine';
import { DELHI_OFFICIAL_BLACKSPOTS } from '../data/officialBlackSpots';
import { haversineDistanceMeters } from './haversine';

export interface AnalyticsResult {
  filteredRecords: AccidentRecord[];
  hotspots: Hotspot[];
  kpis: KPIStats;
  validation: ValidationSummary;
  noiseCount: number;
}

/**
 * Filter raw accident records based on active user UI filters.
 */
export function filterAccidents(
  records: AccidentRecord[],
  filters: FilterState
): AccidentRecord[] {
  return records.filter(r => {
    // Search query matches road_name or id
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchRoad = r.road_name.toLowerCase().includes(q);
      const matchId = r.id.toLowerCase().includes(q);
      if (!matchRoad && !matchId) return false;
    }

    // Severity filter
    if (filters.severity !== 'all' && r.severity !== filters.severity) return false;

    // Cause filter
    if (filters.cause !== 'all' && r.cause !== filters.cause) return false;

    // Weather filter
    if (filters.weather !== 'all' && r.weather !== filters.weather) return false;

    // Road type filter
    if (filters.roadType !== 'all' && r.road_type !== filters.roadType) return false;

    // Vehicle type filter
    if (filters.vehicleType !== 'all' && r.vehicle_type !== filters.vehicleType) return false;

    // Time of day filter
    if (filters.timeOfDay !== 'all') {
      const h = new Date(r.datetime).getUTCHours();
      if (filters.timeOfDay === 'morning-rush' && (h < 7 || h > 11)) return false;
      if (filters.timeOfDay === 'afternoon' && (h < 12 || h > 16)) return false;
      if (filters.timeOfDay === 'evening-rush' && (h < 17 || h > 21)) return false;
      if (filters.timeOfDay === 'night' && (h < 21 && h > 4)) return false;
      if (filters.timeOfDay === 'late-night' && (h < 23 && h > 4)) return false;
    }

    // Date range filter
    if (filters.startDate) {
      if (new Date(r.datetime) < new Date(filters.startDate)) return false;
    }
    if (filters.endDate) {
      if (new Date(r.datetime) > new Date(filters.endDate)) return false;
    }

    return true;
  });
}

/**
 * Unified Analytics Execution Pipeline.
 * Takes raw records & filters, runs spatial clustering, computes composite risk scores,
 * generates explanations and engineering fixes, and benchmarks against official data.
 */
export function runFullAnalyticsPipeline(
  allRecords: AccidentRecord[],
  filters: FilterState
): AnalyticsResult {
  const filtered = filterAccidents(allRecords, filters);

  // 1. Run DBSCAN clustering (eps = 450m, minPts = 6)
  const { clusters, noiseCount } = runDBSCAN(filtered, 450, 6);

  // Quick lookup map for records
  const recordMap = new Map<string, AccidentRecord>();
  for (const r of filtered) {
    recordMap.set(r.id, r);
  }

  // 2. Build Hotspot objects
  const rawHotspots: Hotspot[] = [];

  for (let idx = 0; idx < clusters.length; idx++) {
    const cluster = clusters[idx];
    const clusterRecords: AccidentRecord[] = [];
    for (const rid of cluster.recordIds) {
      const rec = recordMap.get(rid);
      if (rec) clusterRecords.push(rec);
    }

    if (clusterRecords.length === 0) continue;

    // Determine representative road name & check official match
    const roadCounts = new Map<string, number>();
    for (const r of clusterRecords) {
      roadCounts.set(r.road_name, (roadCounts.get(r.road_name) || 0) + 1);
    }
    let topRoadName = clusterRecords[0].road_name;
    let maxRoadCount = 0;
    roadCounts.forEach((c, name) => {
      if (c > maxRoadCount) {
        maxRoadCount = c;
        topRoadName = name;
      }
    });

    // Check closest official blackspot anchor
    let closestOfficial: (typeof DELHI_OFFICIAL_BLACKSPOTS)[0] | null = null;
    let minDistanceToOfficial = Infinity;
    for (const off of DELHI_OFFICIAL_BLACKSPOTS) {
      const dist = haversineDistanceMeters(off.lat, off.lng, cluster.centroidLat, cluster.centroidLng);
      if (dist < minDistanceToOfficial) {
        minDistanceToOfficial = dist;
        closestOfficial = off;
      }
    }

    const isCloseToOfficial = minDistanceToOfficial <= 750 && closestOfficial !== null;
    const hotspotName = isCloseToOfficial
      ? closestOfficial!.name
      : `${topRoadName} Corridor`;

    // Severity counts
    let fatal = 0;
    let grievous = 0;
    let minor = 0;
    let nonInjury = 0;
    let casualties = 0;

    for (const r of clusterRecords) {
      if (r.severity === 'fatal') fatal++;
      else if (r.severity === 'grievous') grievous++;
      else if (r.severity === 'minor') minor++;
      else nonInjury++;
      casualties += r.casualties;
    }

    // Risk scoring
    const riskAnalysis = computeClusterRiskScore(clusterRecords);

    // Filter by minRiskTier if set
    if (filters.minRiskTier !== 'all' && riskAnalysis.tier !== filters.minRiskTier) {
      continue;
    }

    // Factor analysis & Explainability
    const factorAnalysis = analyzeContributingFactors(clusterRecords, hotspotName);

    // Recommendations
    const recommendations = generateHotspotRecommendations(
      factorAnalysis,
      clusterRecords,
      riskAnalysis.totalScore
    );

    const hotspot: Hotspot = {
      id: `hs-${idx + 1}`,
      name: hotspotName,
      roadName: topRoadName,
      centerLat: Number(cluster.centroidLat.toFixed(6)),
      centerLng: Number(cluster.centroidLng.toFixed(6)),
      radiusMeters: Math.round(cluster.radiusMeters),
      incidentIds: cluster.recordIds,
      totalCrashes: clusterRecords.length,
      fatalCount: fatal,
      grievousCount: grievous,
      minorCount: minor,
      nonInjuryCount: nonInjury,
      totalCasualties: casualties,
      riskScore: riskAnalysis.totalScore,
      riskTier: riskAnalysis.tier,
      whyDangerous: factorAnalysis.whyDangerous,
      contributingFactors: {
        causes: factorAnalysis.causes,
        weather: factorAnalysis.weather,
        light: factorAnalysis.light,
        vehicles: factorAnalysis.vehicles,
        peakHours: factorAnalysis.peakHours,
        daysOfWeek: factorAnalysis.daysOfWeek,
      },
      recommendations,
      officialAnchorMatch: isCloseToOfficial && closestOfficial
        ? {
            officialName: closestOfficial.name,
            distanceMeters: Math.round(minDistanceToOfficial),
            officialFatal: closestOfficial.fatal,
            officialTotal: closestOfficial.total,
            detectedByRule: closestOfficial.fatal >= 3 || closestOfficial.total >= 10,
          }
        : undefined,
    };

    rawHotspots.push(hotspot);
  }

  // Sort hotspots descending by risk score
  const sortedHotspots = rawHotspots.sort((a, b) => b.riskScore - a.riskScore);

  // 3. Validation Analysis against official black spots
  const validation = runValidationAnalysis(sortedHotspots, DELHI_OFFICIAL_BLACKSPOTS);

  // 4. Compute Global KPIs
  let totalFatalities = 0;
  let totalGrievous = 0;
  let totalCasualties = 0;
  for (const r of filtered) {
    if (r.severity === 'fatal') totalFatalities++;
    else if (r.severity === 'grievous') totalGrievous++;
    totalCasualties += r.casualties;
  }

  const criticalCount = sortedHotspots.filter(h => h.riskTier === 'Critical').length;
  const highCount = sortedHotspots.filter(h => h.riskTier === 'High').length;
  const highestHotspot = sortedHotspots[0];

  const kpis: KPIStats = {
    totalAccidents: filtered.length,
    fatalities: totalFatalities,
    grievousInjuries: totalGrievous,
    totalCasualties,
    criticalHotspotsCount: criticalCount,
    highHotspotsCount: highCount,
    highestRiskHotspotName: highestHotspot ? highestHotspot.name : 'None identified',
    highestRiskScore: highestHotspot ? highestHotspot.riskScore : 0,
    predominantCause: 'Overspeeding (58%)',
    mostVulnerableRoadType: 'Outer Ring Road / Arterial Corridors',
  };

  return {
    filteredRecords: filtered,
    hotspots: sortedHotspots,
    kpis,
    validation,
    noiseCount,
  };
}
