import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
export { sql } from "drizzle-orm";

declare global {
  // eslint-disable-next-line no-var
  var __vscanmail_mysql_pool: mysql.Pool | undefined;
}

function createPool() {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT || 3306);

  if (!host || !user || !database) {
    throw new Error(
      "Missing MySQL env. Required: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (and optional MYSQL_PORT)."
    );
  }

  return mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    // --- Capacity ---
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // --- Stale-connection protection ---
    // MySQL closes idle connections after `wait_timeout` (default 8h). Recycle
    // pooled connections well before that so a request after a long idle period
    // never grabs a dead socket (the cause of overnight "ECONNRESET" failures).
    maxIdle: 10,
    idleTimeout: 300000, // 5 min — evict idle connections proactively
    // TCP keepalive keeps active connections healthy across NAT/Docker.
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    // Fail fast instead of hanging if MySQL is briefly unreachable.
    connectTimeout: 20000,
  });
}

export const mysqlPool = globalThis.__vscanmail_mysql_pool ?? createPool();
globalThis.__vscanmail_mysql_pool = mysqlPool;

export const db = drizzle(mysqlPool);

