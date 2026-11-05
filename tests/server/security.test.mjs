import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { connect } from "../../scripts/db/connection.mjs";
import { generate, generateSecret } from "otplib";

let pool, root, service, crypto, config;
const dbName = `iax_admin_test_${randomBytes(6).toString("hex")}`;
const password = "A long unique test passphrase! 982";
before(async () => {
  const module = await import("../../server/admin/service.mjs");
  crypto = await import("../../server/admin/crypto.mjs");
  root = await connect(false);
  await root.query(`CREATE DATABASE \`${dbName}\``);
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: dbName,
    timezone: "Z",
    multipleStatements: true,
    connectionLimit: 6,
  });
  await pool.query(
    await readFile(
      new URL(
        "../../database/migrations/003_admin_schema.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  config = {
    encryptionKey: randomBytes(32),
    origin: "http://127.0.0.1:5173",
    production: false,
  };
  service = module.createAdminService(pool, config);
});
after(async () => {
  await pool?.end();
  if (root) {
    await root.query(`DROP DATABASE \`${dbName}\``);
    await root.end();
  }
});
let n = 0;
async function account() {
  const username = `admin${++n}`;
  const secret = generateSecret();
  const result = await service.provision({
    username,
    displayName: "Test Administrator",
    password,
    secret,
    operator: "automated-test",
  });
  return { username, secret, ...result };
}
async function pending(a) {
  const boot = await service.bootstrap();
  return service.login({
    token: boot.token,
    csrf: boot.csrf,
    username: a.username,
    password,
    ip: "127.0.0.1",
    userAgent: "security-test",
  });
}
async function authenticated(a) {
  const challenge = await pending(a);
  const code = await generate({ secret: a.secret });
  return service.verify({
    token: challenge.token,
    csrf: challenge.csrf,
    code,
    ip: "127.0.0.1",
    userAgent: "security-test",
  });
}
test("password hashing and authenticated encryption protect stored credentials", async () => {
  const hash = await crypto.hashPassword(password);
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await crypto.verifyPassword(hash, password), true);
  assert.equal(await crypto.verifyPassword(hash, "wrong"), false);
  assert.throws(() => crypto.validatePassword("short"));
  const encrypted = crypto.encryptSecret("SECRET", config.encryptionKey);
  assert.equal(crypto.decryptSecret(encrypted, config.encryptionKey), "SECRET");
  assert.throws(() => crypto.decryptSecret(encrypted, randomBytes(32)));
});
test("password alone never grants ADMIN; MFA creates a fresh revocable session", async () => {
  const a = await account(),
    p = await pending(a);
  await assert.rejects(service.session(p.token), { status: 401 });
  await assert.rejects(
    service.verify({
      token: p.token,
      csrf: p.csrf,
      code: "00000000",
      ip: "127.0.0.1",
    }),
    { status: 401 },
  );
  const s = await service.verify({
    token: p.token,
    csrf: p.csrf,
    code: await generate({ secret: a.secret }),
    ip: "127.0.0.1",
  });
  assert.notEqual(s.token, p.token);
  assert.equal((await service.session(s.token)).user.role, "ADMIN");
  await service.logout(s.token, s.csrf, "127.0.0.1");
  await assert.rejects(service.session(s.token), { status: 401 });
});
test("unknown user, wrong password and inactive account fail with generic error", async () => {
  const a = await account();
  for (const [username, pw] of [
    ["not-present", password],
    [a.username, "wrong"],
    ["' OR 1=1 --", password],
  ]) {
    const b = await service.bootstrap();
    await assert.rejects(
      service.login({
        token: b.token,
        csrf: b.csrf,
        username,
        password: pw,
        ip: "127.0.0.2",
      }),
      { status: 401, message: "Username atau password tidak valid." },
    );
  }
  await service.manage(a.username, "disable", "test");
  await assert.rejects(pending(a), { status: 401 });
});
test("concurrent MFA replay issues at most one authorized session", async () => {
  const a = await account(),
    p = await pending(a),
    code = await generate({ secret: a.secret });
  const results = await Promise.allSettled(
    Array.from({ length: 3 }, () =>
      service.verify({ token: p.token, csrf: p.csrf, code, ip: "127.0.0.1" }),
    ),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const again = await pending(a);
  await assert.rejects(
    service.verify({
      token: again.token,
      csrf: again.csrf,
      code,
      ip: "127.0.0.1",
    }),
    { status: 401 },
  );
});
test("recovery code is stored hashed and consumed only once", async () => {
  const a = await account(),
    p = await pending(a),
    code = a.recoveryCodes[0];
  await service.verify({ token: p.token, csrf: p.csrf, code, ip: "127.0.0.1" });
  const p2 = await pending(a);
  await assert.rejects(
    service.verify({ token: p2.token, csrf: p2.csrf, code, ip: "127.0.0.1" }),
    { status: 401 },
  );
  const [rows] = await pool.execute(
    "SELECT code_hash FROM admin_mfa_recovery_codes WHERE admin_user_id=?",
    [a.id],
  );
  assert.ok(rows.every((row) => row.code_hash !== code));
});
test("disabling admin invalidates active sessions and pending MFA challenges", async () => {
  const a = await account(),
    s = await authenticated(a),
    p = await pending(a);
  await service.manage(a.username, "disable", "test");
  await assert.rejects(service.session(s.token), { status: 401 });
  await assert.rejects(
    service.verify({
      token: p.token,
      csrf: p.csrf,
      code: a.recoveryCodes[0],
      ip: "127.0.0.1",
    }),
    { status: 401 },
  );
  await service.manage(a.username, "enable", "test");
  await assert.rejects(service.session(s.token), { status: 401 });
});
test("idle and absolute timeouts are enforced by server", async () => {
  for (const column of ["last_activity_at", "expires_at"]) {
    const a = await account(),
      s = await authenticated(a);
    await pool.execute(
      `UPDATE admin_sessions SET ${column}=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 31 MINUTE) WHERE session_token_hash=?`,
      [crypto.tokenHash(s.token)],
    );
    await assert.rejects(service.session(s.token), { status: 401 });
  }
});
test("CSRF is required; password change revokes every session and challenge", async () => {
  const a = await account(),
    s = await authenticated(a),
    p = await pending(a);
  await assert.rejects(service.logout(s.token, "invalid", "127.0.0.1"), {
    status: 403,
  });
  await assert.rejects(
    service.changePassword(
      s.token,
      s.csrf,
      {
        oldPassword: "wrong",
        newPassword: password + "new",
        code: a.recoveryCodes[0],
      },
      "127.0.0.1",
    ),
    { status: 401 },
  );
  await service.changePassword(
    s.token,
    s.csrf,
    {
      oldPassword: password,
      newPassword: password + "new",
      code: a.recoveryCodes[0],
    },
    "127.0.0.1",
  );
  await assert.rejects(service.session(s.token), { status: 401 });
  await assert.rejects(
    service.verify({
      token: p.token,
      csrf: p.csrf,
      code: a.recoveryCodes[1],
      ip: "127.0.0.1",
    }),
    { status: 401 },
  );
});
test("repeated failed login is throttled persistently", async () => {
  const a = await account();
  let limited = false;
  for (let i = 0; i < 10; i++) {
    const b = await service.bootstrap();
    try {
      await service.login({
        token: b.token,
        csrf: b.csrf,
        username: a.username,
        password: "bad",
        ip: "127.0.0.99",
      });
    } catch (e) {
      if (e.status === 429) limited = true;
      else assert.equal(e.status, 401);
    }
  }
  assert.equal(limited, true);
});
test("distributed account throttling recovers after capped cooldown instead of locking the account for fifteen minutes", async () => {
  const a = await account();
  await pending(a);
  await pool.execute(
    "UPDATE admin_rate_limits SET hits=100,last_attempt_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 31 SECOND) WHERE bucket_hash=?",
    [crypto.tokenHash("login-account:" + a.username)],
  );
  await assert.doesNotReject(pending(a));
  await assert.rejects(pending(a), { status: 429 });
});
test("bootstrap challenge and CSRF cannot be replayed or fixed into a session", async () => {
  const a = await account(),
    b = await service.bootstrap();
  await assert.rejects(
    service.login({
      token: b.token,
      csrf: "wrong",
      username: a.username,
      password,
      ip: "127.0.1.1",
    }),
    { status: 403 },
  );
  const p = await service.login({
    token: b.token,
    csrf: b.csrf,
    username: a.username,
    password,
    ip: "127.0.1.1",
  });
  assert.notEqual(p.token, b.token);
  await assert.rejects(
    service.login({
      token: b.token,
      csrf: b.csrf,
      username: a.username,
      password,
      ip: "127.0.1.1",
    }),
    { status: 401 },
  );
  const s = await service.verify({
    token: p.token,
    csrf: p.csrf,
    code: a.recoveryCodes[0],
    ip: "127.0.1.1",
  });
  await assert.rejects(service.session(b.token), { status: 401 });
  await assert.rejects(service.session(p.token), { status: 401 });
  const [stored] = await pool.execute(
    "SELECT session_token_hash FROM admin_sessions WHERE admin_user_id=?",
    [a.id],
  );
  assert.equal(stored.length, 1);
  assert.notEqual(stored[0].session_token_hash, s.token);
});
test("expired MFA challenge and exhausted attempts cannot create a session", async () => {
  const a = await account(),
    p = await pending(a);
  await pool.execute(
    "UPDATE admin_auth_challenges SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 SECOND) WHERE token_hash=?",
    [crypto.tokenHash(p.token)],
  );
  await assert.rejects(
    service.verify({
      token: p.token,
      csrf: p.csrf,
      code: a.recoveryCodes[0],
      ip: "127.0.1.2",
    }),
    { status: 401 },
  );
  const q = await pending(a);
  for (let i = 0; i < 5; i++)
    await assert.rejects(
      service.verify({
        token: q.token,
        csrf: q.csrf,
        code: "a".repeat(32),
        ip: "127.0.1.2",
      }),
      { status: 401 },
    );
  await assert.rejects(
    service.verify({
      token: q.token,
      csrf: q.csrf,
      code: a.recoveryCodes[0],
      ip: "127.0.1.2",
    }),
    { status: 401 },
  );
});
test("logout-all requires password and fresh factor and revokes all devices", async () => {
  const a = await account(),
    first = await authenticated(a),
    p = await pending(a);
  const second = await service.verify({
    token: p.token,
    csrf: p.csrf,
    code: a.recoveryCodes[0],
    ip: "127.0.1.3",
  });
  await assert.rejects(
    service.revokeAll(
      first.token,
      first.csrf,
      { oldPassword: password, code: "f".repeat(32) },
      "127.0.1.3",
    ),
    { status: 401 },
  );
  assert.equal((await service.session(first.token)).user.role, "ADMIN");
  await service.revokeAll(
    first.token,
    first.csrf,
    { oldPassword: password, code: a.recoveryCodes[1] },
    "127.0.1.3",
  );
  await assert.rejects(service.session(first.token), { status: 401 });
  await assert.rejects(service.session(second.token), { status: 401 });
});
test("MFA concurrent with disable cannot retain an authorized session", async () => {
  const a = await account(),
    p = await pending(a);
  const [factor] = await Promise.allSettled([
    service.verify({
      token: p.token,
      csrf: p.csrf,
      code: a.recoveryCodes[0],
      ip: "127.0.1.4",
    }),
    service.manage(a.username, "disable", "race-test"),
  ]);
  if (factor.status === "fulfilled")
    await assert.rejects(service.session(factor.value.token), { status: 401 });
  const [rows] = await pool.execute(
    "SELECT id FROM admin_sessions WHERE admin_user_id=? AND revoked_at IS NULL",
    [a.id],
  );
  assert.equal(rows.length, 0);
});
test("MFA concurrent with password reset cannot retain an authorized session", async () => {
  const a = await account(),
    p = await pending(a);
  const [factor, reset] = await Promise.allSettled([
    service.verify({
      token: p.token,
      csrf: p.csrf,
      code: a.recoveryCodes[0],
      ip: "127.0.1.8",
    }),
    service.manage(a.username, "reset-password", "race-test", {
      password: password + " reset race",
    }),
  ]);
  assert.equal(reset.status, "fulfilled");
  if (factor.status === "fulfilled")
    await assert.rejects(service.session(factor.value.token), { status: 401 });
  const [rows] = await pool.execute(
    "SELECT id FROM admin_sessions WHERE admin_user_id=? AND revoked_at IS NULL",
    [a.id],
  );
  assert.equal(rows.length, 0);
});
test("developer password and MFA reset invalidate old credentials and recovery codes", async () => {
  const a = await account(),
    p = await pending(a);
  await service.manage(a.username, "reset-password", "operator", {
    password: password + " reset",
  });
  await assert.rejects(
    service.verify({
      token: p.token,
      csrf: p.csrf,
      code: a.recoveryCodes[0],
      ip: "127.0.1.5",
    }),
    { status: 401 },
  );
  await assert.rejects(pending(a), { status: 401 });
  const fresh = generateSecret();
  const reset = await service.manage(a.username, "reset-mfa", "operator", {
    secret: fresh,
  });
  const b = await service.bootstrap();
  const next = await service.login({
    token: b.token,
    csrf: b.csrf,
    username: a.username,
    password: password + " reset",
    ip: "127.0.1.5",
  });
  await assert.rejects(
    service.verify({
      token: next.token,
      csrf: next.csrf,
      code: a.recoveryCodes[1],
      ip: "127.0.1.5",
    }),
    { status: 401 },
  );
  const s = await service.verify({
    token: next.token,
    csrf: next.csrf,
    code: reset.recoveryCodes[0],
    ip: "127.0.1.5",
  });
  assert.equal((await service.session(s.token)).user.username, a.username);
});
test("operator reset and revoke invalidate pending challenges; audits contain no secrets", async () => {
  const a = await account(),
    p = await pending(a);
  await service.manage(a.username, "revoke-sessions", "operator");
  await assert.rejects(
    service.verify({
      token: p.token,
      csrf: p.csrf,
      code: a.recoveryCodes[0],
      ip: "127.0.0.1",
    }),
    { status: 401 },
  );
  const [logs] = await pool.query("SELECT * FROM admin_audit_logs");
  const dump = JSON.stringify(logs);
  assert.ok(logs.length > 0);
  for (const secret of [
    password,
    a.secret,
    ...a.recoveryCodes,
    p.token,
    p.csrf,
  ])
    assert.equal(dump.includes(secret), false);
});
