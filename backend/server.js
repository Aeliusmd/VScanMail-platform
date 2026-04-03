import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import customerBillingRoutes from "./routes/customerBilling.js";
import customerAccountRoutes from "./routes/customerAccount.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/customer/billing", customerBillingRoutes);
app.use("/api/customer/account", customerAccountRoutes);

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
