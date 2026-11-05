import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { connect, database, reportError } from "./connection.mjs";
let connection;
let locked = false;
try {
  connection = await connect(false);
  const [[lock]] = await connection.query(
    "SELECT GET_LOCK(?, 10) AS acquired",
    [`iax_migrate_${database}`],
  );
  if (lock.acquired !== 1)
    throw new Error(
      "Another database migration is running. Try again after it finishes.",
    );
  locked = true;
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
  );
  await connection.changeUser({ database });
  await connection.query("SET SESSION time_zone = '+00:00'");
  const [tables] = await connection.query("SHOW TABLES");
  const names = tables.map((row) => Object.values(row)[0]);
  if (names.length && !names.includes("schema_migrations"))
    throw new Error(
      "Database contains unmanaged tables. Choose a fresh MYSQL_DATABASE; existing data was not changed.",
    );
  await connection.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(180) PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB",
  );
  const dir = new URL("../../database/migrations/", import.meta.url);
  for (const name of (await readdir(dir))
    .filter((x) => x.endsWith(".sql"))
    .sort()) {
    const sql = (await readFile(new URL(name, dir), "utf8")).replace(
      /^\uFEFF/,
      "",
    );
    const checksum = createHash("sha256")
      .update(sql.replaceAll("\r\n", "\n"))
      .digest("hex");
    const [applied] = await connection.execute(
      "SELECT checksum FROM schema_migrations WHERE name=?",
      [name],
    );
    if (applied.length) {
      if (applied[0].checksum !== checksum)
        throw new Error(
          `Applied migration ${name} has changed. Restore it and add a new migration.`,
        );
      console.log(`Already applied: ${name}`);
      continue;
    }
    const transactional = !name.endsWith("_schema.sql");
    if (transactional) await connection.beginTransaction();
    try {
      await connection.query(sql);
      await connection.execute(
        "INSERT INTO schema_migrations (name,checksum) VALUES (?,?)",
        [name, checksum],
      );
      if (transactional) await connection.commit();
    } catch (error) {
      if (transactional) await connection.rollback();
      throw error;
    }
    console.log(`Applied: ${name}`);
  }
  console.log(
    `Database ready: ${database}. Migrations complete; create admin accounts only through the developer CLI.`,
  );
} catch (error) {
  reportError(error);
} finally {
  if (connection) {
    if (locked)
      await connection
        .query("SELECT RELEASE_LOCK(?)", [`iax_migrate_${database}`])
        .catch(() => {});
    await connection.end();
  }
}
