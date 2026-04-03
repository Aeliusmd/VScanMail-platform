import mongoose from "mongoose";

const upgradeRequestSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    planId: { type: String, required: true },
    status: { type: String, enum: ["pending", "processed"], default: "pending" },
  },
  { timestamps: true }
);

export const UpgradeRequest =
  mongoose.models.UpgradeRequest || mongoose.model("UpgradeRequest", upgradeRequestSchema);
