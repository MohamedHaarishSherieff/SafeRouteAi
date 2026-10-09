import { AccidentRecord, RiskTier } from '@/types/accidents';

export interface DetailedRiskScore {
  totalScore: number; // 0 - 100
  tier: RiskTier;
  components: {
    severityScore: number;     // 0 - 100 (40% weight)
    frequencyScore: number;    // 0 - 100 (25% weight)
    casualtyScore: number;     // 0 - 100 (15% weight)
    recencyScore: number;      // 0 - 100 (10% weight)
    exposureMultiplier: number;// 0.8x - 1.4x (10% adjustment)
  };
  weightsExplanation: string;
}

/**
 * Computes an explainable, multi-factor risk score (0-100) for a group of accidents.
 */
export function computeClusterRiskScore(
  records: AccidentRecord[],
  referenceNow: Date = new Date('2024-12-31T23:59:59Z')
): DetailedRiskScore {
  if (records.length === 0) {
    return {
      totalScore: 0,
      tier: 'Low',
      components: {
        severityScore: 0,
        frequencyScore: 0,
        casualtyScore: 0,
        recencyScore: 0,
        exposureMultiplier: 1.0,
      },
      weightsExplanation: 'No incidents recorded.',
    };
  }

  const count = records.length;
  let fatal = 0;
  let grievous = 0;
  let minor = 0;
  let nonInjury = 0;
  let totalCasualties = 0;
  let recencySum = 0;

  // Exposure weights by road type
  const exposureWeights: Record<string, number> = {
    highway: 1.35,
    'flyover-approach': 1.30,
    junction: 1.25,
    arterial: 1.10,
    residential: 0.85,
  };
  let exposureSum = 0;

  for (const r of records) {
    if (r.severity === 'fatal') fatal++;
    else if (r.severity === 'grievous') grievous++;
    else if (r.severity === 'minor') minor++;
    else nonInjury++;

    totalCasualties += r.casualties;

    // Recency decay: exponential-like decay based on months elapsed from reference date
    const incidentDate = new Date(r.datetime);
    const monthsElapsed = Math.max(0, (referenceNow.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4));
    const decay = Math.exp(-0.02 * monthsElapsed); // ~0.78 at 12 mos, ~0.61 at 24 mos
    recencySum += decay;

    exposureSum += (exposureWeights[r.road_type] || 1.0);
  }

  // 1. Severity Score (40% weight): Lethality and bodily injury ratio
  // Base maximum score when 30%+ crashes are fatal or grievous
  const rawSeverityPerCrash = (fatal * 5.0 + grievous * 3.0 + minor * 1.0 + nonInjury * 0.2) / count;
  const severityScore = Math.min(100, Math.round((rawSeverityPerCrash / 3.8) * 100));

  // 2. Frequency Score (25% weight): Scale relative to highest density urban clusters
  // 100+ crashes over 3 years is considered extreme density in Indian urban centers
  const frequencyScore = Math.min(100, Math.round(Math.min(1, Math.log10(count + 1) / Math.log10(120)) * 100));

  // 3. Casualty Density (15% weight): Average human casualties per incident
  const casualtyPerCrash = totalCasualties / count;
  const casualtyScore = Math.min(100, Math.round(Math.min(1, casualtyPerCrash / 1.5) * 100));

  // 4. Recency Score (10% weight): Recent clustering of crashes
  const avgRecency = recencySum / count;
  const recencyScore = Math.min(100, Math.round(avgRecency * 100));

  // 5. Exposure Multiplier: Road geometry vulnerability
  const avgExposure = exposureSum / count;

  // Composite calculation
  const weightedSum =
    severityScore * 0.40 +
    frequencyScore * 0.25 +
    casualtyScore * 0.15 +
    recencyScore * 0.10;

  const adjustedScore = weightedSum * (avgExposure / 1.15);
  const totalScore = Math.max(1, Math.min(100, Math.round(adjustedScore)));

  // Risk Tier Classification
  let tier: RiskTier = 'Low';
  if (totalScore >= 75) tier = 'Critical';
  else if (totalScore >= 55) tier = 'High';
  else if (totalScore >= 35) tier = 'Medium';

  return {
    totalScore,
    tier,
    components: {
      severityScore,
      frequencyScore,
      casualtyScore,
      recencyScore,
      exposureMultiplier: Number(avgExposure.toFixed(2)),
    },
    weightsExplanation:
      'Risk = (40% Severity [Fatal=5x, Grievous=3x] + 25% Crash Volume + 15% Casualty Density + 10% Recency Decay) × Road Exposure Multiplier',
  };
}
