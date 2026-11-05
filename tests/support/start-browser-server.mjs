// Explicit test harness only: isolated random database; never production seeding.
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { createServer } from "vite";
import { generateSecret } from "otplib";
import { connect } from "../../scripts/db/connection.mjs";
import { createPool } from "../../server/db.mjs";
import { createAdminService } from "../../server/admin/service.mjs";
import { createApp } from "../../server/app.mjs";
const database = `iax_admin_browser_test_${randomBytes(6).toString("hex")}`;
const root = await connect(false);
await root.query(`CREATE DATABASE \`${database}\``);
try {
  await root.query(`USE \`${database}\``);
  await root.query(
    await readFile(
      new URL(
        "../../database/migrations/003_admin_schema.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
} finally {
  await root.end();
}
const pool = createPool({ ...process.env, MYSQL_DATABASE: database });
const config = {
  production: false,
  origin: "http://127.0.0.1:5175",
  encryptionKey: randomBytes(32),
  trustProxy: [],
};
const service = createAdminService(pool, config),
  accounts = [];
for (let i = 0; i < 4; i++) {
  const username = `browser${i}`,
    password = randomBytes(24).toString("hex"),
    secret = generateSecret();
  const { recoveryCodes } = await service.provision({
    username,
    displayName:
      i === 3 ? "<img src=x onerror=alert(1)>" : "Nadia Administrator",
    password,
    secret,
    operator: "isolated-browser-test",
  });
  accounts.push({ username, password, recoveryCodes, secret });
}
await mkdir(".superpowers", { recursive: true });
await writeFile(
  ".superpowers/browser-fixture.json",
  JSON.stringify({ database, accounts }),
  { mode: 0o600 },
);
const backend = createApp({ pool, config }).listen(3002, "127.0.0.1");
const vite = await createServer({
  server: {
    port: 5175,
    host: "127.0.0.1",
    strictPort: true,
    proxy: { "/api/admin": "http://127.0.0.1:3002" },
  },
});
await vite.listen();
console.log("Isolated admin browser test server ready on 5175.");
for (const sig of ["SIGINT", "SIGTERM"])
  process.on(sig, async () => {
    await vite.close();
    backend.close();
    await pool.end();
    process.exit(0);
  });
