import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    bankName: String,
    accountName: String,
    accountNumber: String,
    routingNumber: String,
    accountType: { type: String, enum: ["Checking", "Savings"] },
    isPrimary: { type: Boolean, default: false },
    addedDate: String,
    lastUsed: String,
    bankLogo: String,
  },
  { _id: false }
);

const customerAccountSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, unique: true, index: true },
    profile: {
      companyName: String,
      contactPerson: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zip: String,
      website: String,
      industry: String,
      employees: String,
    },
    bankAccounts: { type: [bankAccountSchema], default: [] },
    security: {
      twoFactor: { type: Boolean, default: true },
      loginAlerts: { type: Boolean, default: true },
      sessionTimeout: { type: String, default: "30" },
    },
    notifications: {
      newMail: { type: Boolean, default: true },
      chequeReceived: { type: Boolean, default: true },
      depositComplete: { type: Boolean, default: true },
      pickupReady: { type: Boolean, default: false },
      weeklyReport: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const CustomerAccount =
  mongoose.models.CustomerAccount || mongoose.model("CustomerAccount", customerAccountSchema);
