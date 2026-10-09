import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hotspotName, riskScore, riskTier, totalCrashes, fatalCount, casualties, topCause, topVehicle, peakHours } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        // Construct prompt with aggregate statistics only (never sensitive raw data)
        const prompt = `You are a Chief Road Safety & Civil Traffic Engineering Consultant for Delhi Traffic Police.
Analyze the following high-risk black spot data:
- Location: ${hotspotName}
- Risk Index: ${riskScore}/100 (${riskTier})
- Total Crashes: ${totalCrashes} (${fatalCount} Fatalities, ${casualties} Total Casualties)
- Top Causative Factor: ${topCause}
- Most Vulnerable Vehicle: ${topVehicle}
- Peak Accident Timing: ${peakHours || 'Evening / Night hours'}

Provide an executive 3-paragraph safety intelligence brief:
1. Critical Hazard Diagnostic: concise assessment of why this geometry and road behavior creates fatal conflicts.
2. Immediate 30-Day Engineering Mitigation: 2 specific interventions for Delhi PWD & Traffic Police.
3. Long-Term VisionZero Recommendation: structural redesign (flyover/underpass/pedestrian refuge).
Keep it professional, high-impact, and government-grade. Format with clear headers.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const generatedText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (generatedText) {
            return NextResponse.json({
              success: true,
              source: 'Gemini 1.5 Flash (Live AI)',
              brief: generatedText,
            });
          }
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to rule-based engine:', geminiError);
      }
    }

    // Graceful fallback to rule-based engineering intelligence brief
    const fallbackBrief = `### 🚦 Strategic Road Safety Audit Brief: ${hotspotName}
**Authority Review:** Delhi Traffic Police & PWD Crash Mitigation Cell
**Classification:** ${riskTier} Black Spot (Composite Risk Index: ${riskScore}/100)

#### 1. Hazard Diagnosis
Historical crash analysis registers **${totalCrashes} verified incidents** with **${fatalCount} fatal casualties** along this corridor. Primary vulnerability stems from severe speed differentials caused by ${topCause.toLowerCase()}, disproportionately impacting ${topVehicle.toLowerCase()} during peak transition hours (${peakHours || '20:00 - 01:00'}). Inadequate physical separation between through-traffic and slow-moving or pedestrian traffic creates unavoidable conflict vectors.

#### 2. Immediate 30-Day Operational Countermeasures
- **Automated Speed Enforcement:** Deploy high-definition ANPR cameras with automated e-challan integration to enforce the 50 km/h urban arterial ceiling.
- **Visual & Tactical Alerting:** Lay transverse thermoplastic rumble strips with reflective thermoplastic paint 120m in advance of the junction approach to enforce speed shedding.
- **Illumination Standard:** Upgrade high-pressure sodium luminaires to high-output 50+ Lux LED fixtures with zero shadow glare.

#### 3. Long-Term Civil Engineering Remediation (VisionZero)
Initiate a comprehensive geometric redesign including grade-separated pedestrian Foot Overbridges (FOB) equipped with escalator access, continuous anti-climb median barriers, and optimized all-red clearance signal phasing (ITMS SCATS integration) to eliminate transverse crossing conflicts completely.`;

    return NextResponse.json({
      success: true,
      source: apiKey ? 'Rule-Based Fallback' : 'SafeRoute Rule-Based AI Engine (Set GEMINI_API_KEY for live LLM)',
      brief: fallbackBrief,
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate AI insights' },
      { status: 500 }
    );
  }
}
