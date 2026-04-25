import { tool } from "@langchain/core/tools";
import { z } from "zod";

// ============================================================
// TOOL 1: Dynamic Bounty Calculator
// The AI autonomously decides how much to pay validators
// based on the severity of the crisis.
// ============================================================
export const calculateDynamicBountyTool = tool(
  async ({ riskLevel }) => {
    let bounty: number;
    switch (riskLevel) {
      case 'HIGH':   bounty = 100; break; // High risk = fast response needed = higher pay
      case 'MEDIUM': bounty = 50;  break;
      case 'LOW':
      default:       bounty = 20;  break;
    }
    console.log(`[Tool: calculate_dynamic_bounty] Risk=${riskLevel} → Bounty=₹${bounty}`);
    return JSON.stringify({ bounty, riskLevel });
  },
  {
    name: "calculate_dynamic_bounty",
    description: "Calculates the optimal bounty reward (in INR ₹) for validators based on the crisis risk level. HIGH risk pays more to incentivize urgent response.",
    schema: z.object({
      riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe("The classified risk level of the crisis"),
    }),
  }
);

// ============================================================
// TOOL 2: Find Nearby Validators
// The AI queries the database to find available validators
// within a given radius of the crisis location.
// ============================================================
export const findNearbyValidatorsTool = tool(
  async ({ crisisLocation, radiusInKm }) => {
    console.log(`[Tool: find_nearby_validators] Searching within ${radiusInKm}km of "${crisisLocation}"`);

    // Simulated DB query (replace with real GeoFire query in production)
    const mockValidators = [
      { id: "val_001", name: "Priya S.", distance: 0.2, trustScore: 92 },
      { id: "val_002", name: "Rohan M.", distance: 0.8, trustScore: 88 },
      { id: "val_003", name: "Ananya K.", distance: 1.5, trustScore: 75 },
      { id: "val_004", name: "Deepak R.", distance: 3.2, trustScore: 81 },
    ];

    const found = mockValidators.filter(v => v.distance <= radiusInKm);
    // Sort by trust score descending (best validator first)
    found.sort((a, b) => b.trustScore - a.trustScore);

    const result = {
      count: found.length,
      bestValidator: found[0] || null,
      validators: found.map(v => v.id),
      searchRadius: radiusInKm,
    };

    console.log(`[Tool: find_nearby_validators] Found ${found.length} validators. Best: ${found[0]?.name || 'none'}`);
    return JSON.stringify(result);
  },
  {
    name: "find_nearby_validators",
    description: "Queries the database to find available, high-trust validators near the crisis location. Returns the best validator and a list of all available ones.",
    schema: z.object({
      crisisLocation: z.string().describe("The general location or coordinates of the crisis"),
      radiusInKm: z.number().describe("The search radius in kilometers (default 5)"),
    }),
  }
);

export const agentTools = [calculateDynamicBountyTool, findNearbyValidatorsTool];
