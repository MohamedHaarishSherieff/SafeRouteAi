import { AccidentRecord, Recommendation } from '@/types/accidents';
import { HotspotFactorAnalysis } from './factorAnalysis';

export function generateHotspotRecommendations(
  analysis: HotspotFactorAnalysis,
  records: AccidentRecord[],
  riskScore: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const total = records.length;
  if (total === 0) return recommendations;

  const fatalCount = records.filter(r => r.severity === 'fatal').length;
  const annualFatalities = Math.max(1, (fatalCount / 3) * 1.2); // ~3 years of data

  const overspeedPct = analysis.causes.find(c => c.label.includes('Speeding'))?.percentage || 0;
  const redLightPct = analysis.causes.find(c => c.label.includes('Red Light'))?.percentage || 0;
  const nightCrashPct =
    (records.filter(r => r.light_condition === 'darkness-unlit' || r.light_condition === 'darkness-lit').length / total) * 100;
  const vulnerablePct =
    (records.filter(r => r.vehicle_type === 'pedestrian' || r.vehicle_type === 'two-wheeler').length / total) * 100;
  const rainWetPct = analysis.weather.find(w => w.label.includes('Rain'))?.percentage || 0;

  // 1. Speed Management & Enforcement
  if (overspeedPct >= 35 || riskScore >= 70) {
    recommendations.push({
      id: 'rec-speed-cam',
      title: 'Automated ANPR Speed Violation Cameras & Driver Feedback Signs',
      category: 'Enforcement & Surveillance',
      priority: 'Immediate',
      estimatedCost: '₹₹',
      expectedReductionPct: 34,
      livesSavedEstPerYear: Number((annualFatalities * 0.34).toFixed(1)),
      rationale: `Overspeeding accounts for ${overspeedPct}% of crashes. Point-to-point average speed cameras enforce the 50 km/h urban threshold and curb reckless acceleration.`,
      timeframe: '1-2 Weeks',
    });

    recommendations.push({
      id: 'rec-rumble-strips',
      title: 'Thermoplastic Transverse Rumble Strips & Chevron Warning Markings',
      category: 'Civil Engineering',
      priority: 'High',
      estimatedCost: '₹',
      expectedReductionPct: 22,
      livesSavedEstPerYear: Number((annualFatalities * 0.22).toFixed(1)),
      rationale:
        'Tactile and audible feedback alerts drivers 150m ahead of conflict zones, reducing approach velocities by 18-24 km/h.',
      timeframe: '1-2 Weeks',
    });
  }

  // 2. Pedestrian Safety Interventions
  if (vulnerablePct >= 40) {
    recommendations.push({
      id: 'rec-pedestrian-fob',
      title: 'Grade-Separated Pedestrian Foot Overbridge (FOB) with Pelican Signals',
      category: 'Pedestrian Safety',
      priority: 'High',
      estimatedCost: '₹₹₹',
      expectedReductionPct: 45,
      livesSavedEstPerYear: Number((annualFatalities * 0.45).toFixed(1)),
      rationale: `Vulnerable road users represent ${Math.round(vulnerablePct)}% of casualties. Grade-separated crossings eliminate at-grade human-vehicle conflicts on high-speed arterials.`,
      timeframe: '3-6 Months',
    });

    recommendations.push({
      id: 'rec-median-barrier',
      title: 'Continuous High-Tensile Anti-Climb Median Barrier',
      category: 'Civil Engineering',
      priority: 'Immediate',
      estimatedCost: '₹',
      expectedReductionPct: 28,
      livesSavedEstPerYear: Number((annualFatalities * 0.28).toFixed(1)),
      rationale:
        'Prevents dangerous mid-block jaywalking and head-on crossover collisions across opposing carriageways.',
      timeframe: '1-3 Months',
    });
  }

  // 3. Illumination & Night Safety
  if (nightCrashPct >= 30) {
    recommendations.push({
      id: 'rec-high-mast-lighting',
      title: 'High-Mast LED Illumination (Min 50 Lux) & Solar Road Studs (Cat-Eyes)',
      category: 'Lighting & Visibility',
      priority: 'Immediate',
      estimatedCost: '₹₹',
      expectedReductionPct: 38,
      livesSavedEstPerYear: Number((annualFatalities * 0.38).toFixed(1)),
      rationale: `${Math.round(nightCrashPct)}% of incidents occur in low-light conditions. High-uniformity white LED luminaires dramatically improve driver perception-reaction time.`,
      timeframe: '1-2 Weeks',
    });
  }

  // 4. Traffic Signal & Junction Optimization
  if (redLightPct >= 10 || records.some(r => r.road_type === 'junction')) {
    recommendations.push({
      id: 'rec-itms-signal',
      title: 'Adaptive Traffic Signal Control (ITMS) with All-Red Clearance Interval',
      category: 'Traffic Control',
      priority: 'High',
      estimatedCost: '₹₹',
      expectedReductionPct: 31,
      livesSavedEstPerYear: Number((annualFatalities * 0.31).toFixed(1)),
      rationale:
        'Dynamic queue-based signal timing with an extended 3-second all-red phase clears the junction box before conflicting green phases start.',
      timeframe: '1-3 Months',
    });
  }

  // 5. Road Surface Friction Dressing
  if (rainWetPct >= 15 || records.some(r => r.road_type === 'flyover-approach')) {
    recommendations.push({
      id: 'rec-anti-skid',
      title: 'High-Friction Anti-Skid Calcined Bauxite Epoxy Surfacing',
      category: 'Civil Engineering',
      priority: 'Medium',
      estimatedCost: '₹₹',
      expectedReductionPct: 26,
      livesSavedEstPerYear: Number((annualFatalities * 0.26).toFixed(1)),
      rationale:
        'Increases Skid Resistance Value (SRV > 70), cutting emergency braking stopping distance by up to 35% in wet monsoon conditions.',
      timeframe: '1-3 Months',
    });
  }

  return recommendations;
}
