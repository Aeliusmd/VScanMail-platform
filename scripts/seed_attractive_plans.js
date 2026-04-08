const mysql = require("mysql2/promise");
const { drizzle } = require("drizzle-orm/mysql2");
// I'll use direct SQL for seeding to be safe and avoid compilation issues with Drizzle TS schema in pure node JS
require("dotenv").config();

async function seedPlans() {
  console.log("🌱 Seeding attractive billing plans (JS Direct mode)...");

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT || 3306),
  });

  const newPlans = [
    {
      id: "starter",
      name: "Starter",
      price: "29.00",
      max_companies: 1,
      max_scans: 50,
      storage: "5 GB",
      ai_magic: "Basic OCR",
      cheque_handling: "Basic Validation",
      badge: "Best for Individuals",
      badge_color: "bg-slate-500",
      features: JSON.stringify(["50 Scans/mo", "5GB Storage", "Basic AI", "Standard Support"]),
    },
    {
      id: "professional",
      name: "Professional",
      price: "79.00",
      max_companies: 1,
      max_scans: 250,
      storage: "25 GB",
      ai_magic: "AI Summary & Risk Detection",
      cheque_handling: "Priority Validation",
      badge: "Most Popular",
      badge_color: "bg-[#0A3D8F]",
      features: JSON.stringify(["250 Scans/mo", "25GB Storage", "Advanced AI", "Priority Support"]),
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "199.00",
      max_companies: 1,
      max_scans: 999999, // Unlimited
      storage: "100 GB+",
      ai_magic: "Custom AI Workflows",
      cheque_handling: "Automated Deposit Requests",
      badge: "Corporate Choice",
      badge_color: "bg-emerald-600",
      features: JSON.stringify(["Unlimited Scans", "100GB+ Storage", "Enterprise AI", "Dedicated Manager"]),
    },
  ];

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    for (const plan of newPlans) {
      console.log(`Upserting plan: ${plan.name}`);
      
      // Check if exists
      const [rows] = await pool.query("SELECT id FROM billing_plans WHERE id = ?", [plan.id]);

      if (rows.length > 0) {
        await pool.query(
          "UPDATE billing_plans SET name=?, price=?, max_companies=?, max_scans=?, storage=?, ai_magic=?, cheque_handling=?, badge=?, badge_color=?, features=?, updated_at=? WHERE id=?",
          [plan.name, plan.price, plan.max_companies, plan.max_scans, plan.storage, plan.ai_magic, plan.cheque_handling, plan.badge, plan.badge_color, plan.features, now, plan.id]
        );
      } else {
        await pool.query(
          "INSERT INTO billing_plans (id, name, price, max_companies, max_scans, storage, ai_magic, cheque_handling, badge, badge_color, features, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
          [plan.id, plan.name, plan.price, plan.max_companies, plan.max_scans, plan.storage, plan.ai_magic, plan.cheque_handling, plan.badge, plan.badge_color, plan.features, now, now]
        );
      }
    }
    console.log("✅ Attractive plans seeded successfully via SQL!");
  } catch (err) {
    console.error("❌ SQL Seeding failed:", err);
  } finally {
    await pool.end();
  }
}

seedPlans();
