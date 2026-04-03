import mongoose from "mongoose";

const manualSubSchema = new mongoose.Schema(
  {
    planName: { type: String, default: "Enterprise (Manual)" },
    status: { type: String, default: "Active" },
    notes: {
      type: String,
      default: "Your plan is managed directly by your VScan Mail administrator.",
    },
    startDate: { type: String, default: "Jan 15, 2024" },
    renewalDate: { type: String, default: "Jul 15, 2026" },
    assignedAdmin: { type: String, default: "Sarah Chen" },
    scansUsed: { type: Number, default: 142 },
    scansLimit: { type: Number, default: 500 },
    mailsReceived: { type: Number, default: 89 },
    chequesProcessed: { type: Number, default: 12 },
  },
  { _id: false }
);

const subscriptionSubSchema = new mongoose.Schema(
  {
    planLabel: { type: String, default: "Professional Plan" },
    titleLine: { type: String, default: "Professional — $149/mo" },
    nextBillingDate: { type: String, default: "Apr 22, 2026" },
    scansUsed: { type: Number, default: 312 },
    scansLimit: { type: Number, default: 500 },
    mailsReceived: { type: Number, default: 248 },
    chequesProcessed: { type: Number, default: 19 },
  },
  { _id: false }
);

const customerPlanSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, unique: true, index: true },
    planType: {
      type: String,
      enum: ["manual", "subscription"],
      default: "manual",
    },
    manual: { type: manualSubSchema, default: () => ({}) },
    subscription: { type: subscriptionSubSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const CustomerPlan =
  mongoose.models.CustomerPlan || mongoose.model("CustomerPlan", customerPlanSchema);
