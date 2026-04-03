import express from "express";
import { CustomerPlan } from "../models/CustomerPlan.js";
import { UpgradeRequest } from "../models/UpgradeRequest.js";

const router = express.Router();

const MANUAL_DEFAULTS = {
  planName: "Enterprise (Manual)",
  status: "Active",
  notes: "Your plan is managed directly by your VScan Mail administrator.",
  startDate: "Jan 15, 2024",
  renewalDate: "Jul 15, 2026",
  assignedAdmin: "Sarah Chen",
  scansUsed: 142,
  scansLimit: 500,
  mailsReceived: 89,
  chequesProcessed: 12,
};

const SUBSCRIPTION_DEFAULTS = {
  planLabel: "Professional Plan",
  titleLine: "Professional — $149/mo",
  nextBillingDate: "Apr 22, 2026",
  scansUsed: 312,
  scansLimit: 500,
  mailsReceived: 248,
  chequesProcessed: 19,
};

function mergeManual(m) {
  const o = m && typeof m === "object" ? m.toObject?.() ?? m : {};
  return { ...MANUAL_DEFAULTS, ...o };
}

function mergeSubscription(s) {
  const o = s && typeof s === "object" ? s.toObject?.() ?? s : {};
  return { ...SUBSCRIPTION_DEFAULTS, ...o };
}

/** GET /api/customer/billing?companyId=demo */
router.get("/", async (req, res) => {
  try {
    const companyId = typeof req.query.companyId === "string" ? req.query.companyId : "demo";

    let doc = await CustomerPlan.findOne({ companyId });
    if (!doc) {
      doc = await CustomerPlan.create({
        companyId,
        planType: "manual",
        manual: MANUAL_DEFAULTS,
        subscription: SUBSCRIPTION_DEFAULTS,
      });
    }

    const payload = {
      planType: doc.planType,
      manual: mergeManual(doc.manual),
      subscription: mergeSubscription(doc.subscription),
    };

    res.json(payload);
  } catch (err) {
    console.error("GET /customer/billing", err);
    res.status(500).json({ message: err.message || "Failed to load billing" });
  }
});

/** POST /api/customer/billing/upgrade-request { companyId?, planId } */
router.post("/upgrade-request", async (req, res) => {
  try {
    const companyId = typeof req.body?.companyId === "string" ? req.body.companyId : "demo";
    const planId = req.body?.planId;
    if (!planId || typeof planId !== "string") {
      return res.status(400).json({ message: "planId is required" });
    }
    await UpgradeRequest.create({ companyId, planId, status: "pending" });
    res.status(201).json({ ok: true, message: "Upgrade request recorded" });
  } catch (err) {
    console.error("POST /customer/billing/upgrade-request", err);
    res.status(500).json({ message: err.message || "Failed to submit upgrade request" });
  }
});

export default router;
