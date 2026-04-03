import express from "express";
import { CustomerAccount } from "../models/CustomerAccount.js";

const router = express.Router();

const PROFILE_DEFAULTS = {
  companyName: "Acme Corporation",
  contactPerson: "James Mitchell",
  email: "james@acmecorp.com",
  phone: "+1 (512) 555-0192",
  address: "450 Business Park Drive",
  city: "Austin",
  state: "TX",
  zip: "78701",
  website: "www.acmecorp.com",
  industry: "Technology",
  employees: "51–200",
};

const BANK_SEED = [
  {
    id: "ba1",
    bankName: "Bank of Commerce",
    accountName: "Acme Corp Operating",
    accountNumber: "****4521",
    routingNumber: "****1234",
    accountType: "Checking",
    isPrimary: true,
    addedDate: "Mar 12, 2023",
    lastUsed: "Jan 22, 2024",
    bankLogo:
      "https://readdy.ai/api/search-image?query=modern%20bank%20logo%20icon%20professional%20financial%20institution%20blue%20corporate%20minimal%20design%20simple%20clean%20circle%20emblem&width=40&height=40&seq=bl1&orientation=squarish",
  },
  {
    id: "ba2",
    bankName: "First National Bank",
    accountName: "Acme Corp Savings",
    accountNumber: "****8834",
    routingNumber: "****5678",
    accountType: "Savings",
    isPrimary: false,
    addedDate: "Jun 5, 2023",
    lastUsed: "Dec 10, 2023",
    bankLogo:
      "https://readdy.ai/api/search-image?query=bank%20logo%20icon%20professional%20financial%20symbol%20green%20modern%20minimal%20clean%20design%20simple%20emblem%20corporate&width=40&height=40&seq=bl2&orientation=squarish",
  },
];

function mergeProfile(p) {
  const o = p && typeof p === "object" ? p.toObject?.() ?? p : {};
  return { ...PROFILE_DEFAULTS, ...o };
}

function mergeSecurity(s) {
  const defaults = { twoFactor: true, loginAlerts: true, sessionTimeout: "30" };
  const o = s && typeof s === "object" ? s.toObject?.() ?? s : {};
  return { ...defaults, ...o };
}

function mergeNotifications(n) {
  const defaults = {
    newMail: true,
    chequeReceived: true,
    depositComplete: true,
    pickupReady: false,
    weeklyReport: true,
  };
  const o = n && typeof n === "object" ? n.toObject?.() ?? n : {};
  return { ...defaults, ...o };
}

/** GET /api/customer/account?companyId=demo */
router.get("/", async (req, res) => {
  try {
    const companyId = typeof req.query.companyId === "string" ? req.query.companyId : "demo";

    let doc = await CustomerAccount.findOne({ companyId });
    if (!doc) {
      doc = await CustomerAccount.create({
        companyId,
        profile: PROFILE_DEFAULTS,
        bankAccounts: BANK_SEED,
        security: mergeSecurity({}),
        notifications: mergeNotifications({}),
      });
    }

    const banks = Array.isArray(doc.bankAccounts) && doc.bankAccounts.length ? doc.bankAccounts : BANK_SEED;

    res.json({
      profile: mergeProfile(doc.profile),
      bankAccounts: banks,
      security: mergeSecurity(doc.security),
      notifications: mergeNotifications(doc.notifications),
    });
  } catch (err) {
    console.error("GET /customer/account", err);
    res.status(500).json({ message: err.message || "Failed to load account" });
  }
});

/** PUT /api/customer/account?companyId=demo — body: { profile?, bankAccounts?, security?, notifications? } */
router.put("/", async (req, res) => {
  try {
    const companyId = typeof req.query.companyId === "string" ? req.query.companyId : "demo";
    const body = req.body || {};

    let doc = await CustomerAccount.findOne({ companyId });
    if (!doc) {
      doc = new CustomerAccount({
        companyId,
        profile: PROFILE_DEFAULTS,
        bankAccounts: BANK_SEED,
        security: mergeSecurity({}),
        notifications: mergeNotifications({}),
      });
    }

    if (body.profile && typeof body.profile === "object") {
      const current = mergeProfile(doc.profile);
      doc.profile = mergeProfile({ ...current, ...body.profile });
    }
    if (Array.isArray(body.bankAccounts)) {
      doc.bankAccounts = body.bankAccounts;
    }
    if (body.security && typeof body.security === "object") {
      doc.security = mergeSecurity({ ...mergeSecurity(doc.security), ...body.security });
    }
    if (body.notifications && typeof body.notifications === "object") {
      doc.notifications = mergeNotifications({
        ...mergeNotifications(doc.notifications),
        ...body.notifications,
      });
    }

    await doc.save();

    res.json({
      profile: mergeProfile(doc.profile),
      bankAccounts: doc.bankAccounts?.length ? doc.bankAccounts : BANK_SEED,
      security: mergeSecurity(doc.security),
      notifications: mergeNotifications(doc.notifications),
    });
  } catch (err) {
    console.error("PUT /customer/account", err);
    res.status(500).json({ message: err.message || "Failed to save account" });
  }
});

export default router;
