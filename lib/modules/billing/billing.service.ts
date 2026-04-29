import { usageEventModel } from "./usage.model";
import { clientModel } from "../clients/client.model";

const UNIT_COSTS: Record<string, number> = {
  scan: 0.5,
  ai_analysis: 2.0,
  api_call: 3.0,
  storage: 0.1,
};

function normalizeEventType(eventType: string): "scan" | "ai_analysis" | "api_call" | "storage" {
  switch (eventType) {
    case "envelope_scan":
      return "scan";
    case "ai_summary":
      return "ai_analysis";
    case "cheque_validation":
    case "cheque_approved":
      return "api_call";
    case "storage_gb":
      return "storage";
    case "scan":
    case "ai_analysis":
    case "api_call":
    case "storage":
      return eventType;
    default:
      return "api_call";
  }
}

export const billingService = {
  async trackUsage(clientId: string, eventType: string, quantity: number) {
    const normalizedType = normalizeEventType(eventType);
    const unitCost = UNIT_COSTS[normalizedType] || 0;
    const totalCost = unitCost * quantity;

    // Track usage only
    await usageEventModel.create({
      client_id: clientId,
      event_type: normalizedType,
      quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
    });
  },

  async getUsageSummary(clientId: string, from?: string, to?: string) {
    const events = await usageEventModel.sumByClient(clientId, from, to);

    const summary: Record<string, { quantity: number; cost: number }> = {};
    for (const e of events) {
      if (!summary[e.event_type]) {
        summary[e.event_type] = { quantity: 0, cost: 0 };
      }
      summary[e.event_type].quantity += e.quantity;
      summary[e.event_type].cost += e.total_cost;
    }

    const totalCost = Object.values(summary).reduce(
      (sum, s) => sum + s.cost,
      0
    );

    return { breakdown: summary, totalCost: Math.round(totalCost * 100) / 100 };
  },
};
