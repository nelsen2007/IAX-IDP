import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { loadConfig } from "../../server/config.mjs";
import { createPool } from "../../server/db.mjs";
test("runtime database connections set SQL session timezone to UTC", async () => {
  const pool = createPool();
  try {
    const [[row]] = await pool.query("SELECT @@session.time_zone AS zone");
    assert.equal(row.zone, "+00:00");
  } finally {
    await pool.end();
  }
});
test("production refuses missing encryption key, insecure or ambiguous origins and automatic proxy trust", () => {
  const valid = {
    NODE_ENV: "production",
    ADMIN_ORIGIN: "https://iax.example",
    ADMIN_MFA_ENCRYPTION_KEY: randomBytes(32).toString("hex"),
  };
  assert.equal(loadConfig(valid).production, true);
  for (const patch of [
    { ADMIN_MFA_ENCRYPTION_KEY: "" },
    { ADMIN_ORIGIN: "http://iax.example" },
    { ADMIN_ORIGIN: "https://iax.example/path" },
    { ADMIN_TRUST_PROXY: "true" },
    { ADMIN_TRUST_PROXY: "1" },
  ])
    assert.throws(() => loadConfig({ ...valid, ...patch }));
});
test("developer CLI rejects noninteractive invocation and password command-line arguments", () => {
  for (const args of [
    ["scripts/admin.mjs", "create"],
    ["scripts/admin.mjs", "create", "--password=bad"],
  ]) {
    const result = spawnSync(process.execPath, args, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout.includes("otpauth://"), false);
    assert.equal(result.stderr.includes("bad"), false);
  }
});
