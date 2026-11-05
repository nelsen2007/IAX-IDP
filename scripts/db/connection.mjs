import mysql from "mysql2/promise";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const envPath = fileURLToPath(
  new URL("../../.env.database.local", import.meta.url),
);
if (existsSync(envPath)) process.loadEnvFile(envPath);
export const database = process.env.MYSQL_DATABASE || "iax_2026";
if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(database))
  throw new Error("MYSQL_DATABASE must be a valid database identifier.");
export async function connect(selectDatabase = true) {
  if (!process.env.MYSQL_USER)
    throw new Error(
      "Set MYSQL_USER and MYSQL_PASSWORD in .env.database.local. See .env.database.example.",
    );
  const port = Number(process.env.MYSQL_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid MYSQL_PORT.");
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || "",
    ...(selectDatabase ? { database } : {}),
    multipleStatements: true,
    charset: "utf8mb4",
    timezone: "Z",
    connectTimeout: 5000,
  });
  await connection.query("SET SESSION time_zone = '+00:00'");
  await connection.query(
    "SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION,NO_ZERO_DATE,NO_ZERO_IN_DATE'",
  );
  const [[row]] = await connection.query("SELECT VERSION() AS version");
  const [major, minor, patch] = row.version.split(".").map(Number);
  if (
    row.version.includes("MariaDB") ||
    major < 8 ||
    (major === 8 && minor === 0 && patch < 16)
  ) {
    await connection.end();
    throw new Error("Requires MySQL 8.0.16+ (enforced CHECK constraints).");
  }
  return connection;
}
export function reportError(error) {
  if (error.code === "ER_ACCESS_DENIED_ERROR")
    console.error(
      "MySQL access denied. Check MYSQL_USER and MYSQL_PASSWORD in .env.database.local.",
    );
  else if (error.code)
    console.error(
      `Database operation failed: ${error.code}. No credentials are printed. See database/README.md for recovery steps.`,
    );
  else console.error(error.message);
  process.exitCode = 1;
}
