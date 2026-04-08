import { db } from "../lib/modules/core/db/mysql";
import { billingPlans } from "../lib/modules/core/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function seedPlans() {
  console.log("🌱 Seeding attractive billing plans...");

  const newPlans = [
    {
      id: "starter",
      name: "Starter",
      price: "29.00",
      maxCompanies: 1,
      maxScans: 50,
      storage: "5 GB",
      aiMagic: "Basic OCR",
      chequeHandling: "Basic Validation",
      badge: "Best for Individuals",
      badgeColor: "bg-slate-500",
      features: ["50 Scans/mo", "5GB Storage", "Basic AI", "Standard Support"],
    },
    {
      id: "professional",
      name: "Professional",
      price: "79.00",
      maxCompanies: 1,
      maxScans: 250,
      storage: "25 GB",
      aiMagic: "AI Summary & Risk Detection",
      chequeHandling: "Priority Validation",
      badge: "Most Popular",
      badgeColor: "bg-[#0A3D8F]",
      features: ["250 Scans/mo", "25GB Storage", "Advanced AI", "Priority Support"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "199.00",
      maxCompanies: 1,
      maxScans: 999999, // Unlimited
      storage: "100 GB+",
      aiMagic: "Custom AI Workflows",
      chequeHandling: "Automated Deposit Requests",
      badge: "Corporate Choice",
      badgeColor: "bg-emerald-600",
      features: ["Unlimited Scans", "100GB+ Storage", "Enterprise AI", "Dedicated Manager"],
    },
  ];

  for (const planData of newPlans) {
    // Check if plan exists
    const existing = await db.select().from(billingPlans).where(eq(billingPlans.id, planData.id)).limit(1);

    if (existing.length > 0) {
      console.log(`Updating existing plan: ${planData.name}`);
      await db.update(billingPlans)
        .set({
          ...planData,
          updatedAt: new Date(),
        })
        .where(eq(billingPlans.id, planData.id));
    } else {
      console.log(`Creating new plan: ${planData.name}`);
      await db.insert(billingPlans).values({
        ...planData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  console.log("✅ Attractive plans seeded successfully!");
  process.exit(0);
}

seedPlans().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
