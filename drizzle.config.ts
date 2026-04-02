import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/modules/core/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.MYSQL_HOST!,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER!,
    password: process.env.MYSQL_PASSWORD!,
    database: process.env.MYSQL_DATABASE!,
  },
} satisfies Config;

