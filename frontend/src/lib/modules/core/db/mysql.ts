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
    connectionLimit: 10,
    enableKeepAlive: true,
  });
}

export const mysqlPool = globalThis.__vscanmail_mysql_pool ?? createPool();
globalThis.__vscanmail_mysql_pool = mysqlPool;

export const db = drizzle(mysqlPool);

