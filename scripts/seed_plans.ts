import "dotenv/config";
import { db } from "../lib/modules/core/db/mysql";
import { billingPlans } from "../lib/modules/core/db/schema";
import { eq } from "drizzle-orm";

async function seedPlans() {
  console.log("🌱 Seeding billing plans...");

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "49.00",
      maxCompanies: 5,
      maxScans: 500,
      storage: "10 GB",
      badge: null,
      badgeColor: null,
      features: [
        "Up to 5 companies",
        "500 scans/month",
        "10 GB storage",
        "Email notifications",
        "Basic AI summary",
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "professional",
      name: "Professional",
      price: "149.00",
      maxCompanies: 25,
      maxScans: 2000,
      storage: "50 GB",
      badge: "Most Popular",
      badgeColor: "bg-red-500",
      features: [
        "Up to 25 companies",
        "2,000 scans/month",
        "50 GB storage",
        "Email + SMS notifications",
        "Advanced AI summary",
        "Priority support",
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "349.00",
      maxCompanies: 999,
      maxScans: 999999,
      storage: "200 GB",
      badge: null,
      badgeColor: null,
      features: [
        "Unlimited companies",
        "Unlimited scans",
        "200 GB storage",
        "All notification channels",
        "Custom AI workflows",
        "Dedicated support",
        "Custom integrations",
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const plan of plans) {
    const existing = await db
      .select()
      .from(billingPlans)
      .where(eq(billingPlans.id, plan.id));

    if (existing.length === 0) {
      console.log(`Creating plan: ${plan.name}`);
      await db.insert(billingPlans).values(plan as any);
    } else {
      console.log(`Updating plan: ${plan.name}`);
      await db
        .update(billingPlans)
        .set(plan as any)
        .where(eq(billingPlans.id, plan.id));
    }
  }

  console.log("✅ Seeding complete.");
  process.exit(0);
}

seedPlans().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
