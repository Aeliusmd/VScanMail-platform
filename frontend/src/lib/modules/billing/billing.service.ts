import { usageEventModel } from "./usage.model";
import { clientModel } from "../clients/client.model";

const UNIT_COSTS: Record<string, number> = {
  envelope_scan: 0.5,
  ai_summary: 2.0,
  cheque_validation: 3.0,
  cheque_approved: 0,
  storage_gb: 0.1,
};

export const billingService = {
  async trackUsage(clientId: string, eventType: string, quantity: number) {
    const unitCost = UNIT_COSTS[eventType] || 0;
    const totalCost = unitCost * quantity;

    // Track usage only
    await usageEventModel.create({
      client_id: clientId,
      event_type: eventType,
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
