import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import request from "supertest";
import { connect } from "../../scripts/db/connection.mjs";
import { generateSecret } from "otplib";
let pool, root, app, service, config, createApp;
const name = `iax_admin_test_${randomBytes(6).toString("hex")}`;
const origin = "http://127.0.0.1:5173";
const pw = "A second secure passphrase. 12345";
before(async () => {
  ({ createApp } = await import("../../server/app.mjs"));
  const { createAdminService } = await import("../../server/admin/service.mjs");
  root = await connect(false);
  await root.query(`CREATE DATABASE \`${name}\``);
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: name,
    timezone: "Z",
    multipleStatements: true,
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
    production: false,
    origin,
    encryptionKey: randomBytes(32),
    trustProxy: [],
  };
  service = createAdminService(pool, config);
  app = createApp({ pool, config });
});
after(async () => {
  await pool?.end();
  if (root) {
    await root.query(`DROP DATABASE \`${name}\``);
    await root.end();
  }
});
let id = 0;
async function login() {
  const username = `http${++id}`,
    secret = generateSecret();
  const a = await service.provision({
    username,
    displayName: "<script>alert(1)</script>",
    password: pw,
    secret,
    operator: "http-test",
  });
  const agent = request.agent(app);
  const b = await agent.get("/api/admin/auth/csrf").expect(200);
  const p = await agent
    .post("/api/admin/auth/login")
    .set("Origin", origin)
    .set("X-CSRF-Token", b.body.csrf)
    .send({ username, password: pw })
    .expect(200);
  const before = await agent.get("/api/admin/auth/me");
  assert.equal(before.status, 401);
  const s = await agent
    .post("/api/admin/auth/mfa/verify")
    .set("Origin", origin)
    .set("X-CSRF-Token", p.body.csrf)
    .send({ code: a.recoveryCodes[0] })
    .expect(200);
  return {
    agent,
    csrf: s.body.csrf,
    cookie: s.headers["set-cookie"],
    a,
    username,
  };
}
test("every admin API denies unauthenticated direct access including guessed IDs", async () => {
  for (const route of [
    "/auth/me",
    "/orders",
    "/orders/1",
    "/spk/1",
    "/members/1",
    "/reports",
    "/settings",
    "/auth/register",
  ])
    await request(app)
      .get("/api/admin" + route)
      .set("Cookie", "member_session=forged; role=ADMIN")
      .expect(401);
  for (const route of [
    "/auth/logout",
    "/auth/logout-all",
    "/auth/change-password",
    "/register",
    "/orders/1",
  ])
    await request(app)
      .post("/api/admin" + route)
      .set("Origin", origin)
      .send({ role: "ADMIN" })
      .expect(401);
});
test("real MFA login sets HttpOnly cookie and logout rejects replay", async () => {
  const { agent, csrf, cookie } = await login();
  assert.ok(
    cookie.some(
      (s) =>
        s.includes("HttpOnly") &&
        s.includes("SameSite=Strict") &&
        s.includes("Path=/"),
    ),
  );
  const me = await agent.get("/api/admin/auth/me").expect(200);
  assert.equal(me.body.user.role, "ADMIN");
  assert.equal(JSON.stringify(me.body).includes("password_hash"), false);
  const old = cookie
    .find((s) => s.startsWith("iax_admin_session_dev="))
    .split(";")[0];
  await agent
    .post("/api/admin/auth/logout")
    .set("Origin", origin)
    .set("X-CSRF-Token", csrf)
    .send({})
    .expect(200);
  await request(app).get("/api/admin/auth/me").set("Cookie", old).expect(401);
});
test("mutation requests require both same Origin and session-bound CSRF", async () => {
  const { agent, csrf } = await login();
  await agent
    .post("/api/admin/auth/logout")
    .set("Origin", origin)
    .send({})
    .expect(403);
  await agent
    .post("/api/admin/auth/logout")
    .set("Origin", "https://evil.example")
    .set("X-CSRF-Token", csrf)
    .send({})
    .expect(403);
  await agent
    .post("/api/admin/auth/logout")
    .set("X-CSRF-Token", csrf)
    .send({})
    .expect(403);
  const response = await agent.get("/api/admin/auth/me").expect(200);
  assert.equal(response.headers["cache-control"], "no-store");
  assert.match(
    response.headers["content-security-policy"],
    /frame-ancestors 'none'/,
  );
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["access-control-allow-origin"], undefined);
});
test("login input and invalid JSON never disclose internal errors", async () => {
  const b = await request.agent(app).get("/api/admin/auth/csrf");
  const r = await request(app)
    .post("/api/admin/auth/login")
    .set("Origin", origin)
    .send({ username: "a", password: 123, role: "ADMIN" });
  assert.equal(r.status, 400);
  assert.equal(JSON.stringify(r.body).includes("stack"), false);
  assert.ok(b.body.csrf);
  const bad = await request(app)
    .post("/api/admin/auth/login")
    .set("Origin", origin)
    .set("Content-Type", "application/json")
    .send("{broken");
  assert.equal(bad.status, 400);
  assert.equal(JSON.stringify(bad.body).includes("SyntaxError"), false);
});
test("production server redirects guest admin pages, blocks secret files and sets secure cookies", async () => {
  const prod = createApp({
    pool,
    config: {
      ...config,
      production: true,
      origin: "https://iax.example",
      trustProxy: ["loopback"],
    },
  });
  await request(prod)
    .get("/admin")
    .set("X-Forwarded-Proto", "https")
    .expect(302)
    .expect("Location", "/admin/login");
  for (const path of [
    "/.env",
    "/.env.database.local",
    "/server/config.mjs",
    "/database/migrations/003_admin_schema.sql",
    "/src/App.tsx",
    "/package.json",
    "/assets/test.js.map",
  ])
    await request(prod).get(path).set("X-Forwarded-Proto", "https").expect(404);
  const b = await request(prod)
    .get("/api/admin/auth/csrf")
    .set("X-Forwarded-Proto", "https")
    .expect(200);
  assert.ok(
    b.headers["set-cookie"].some(
      (s) =>
        s.startsWith("__Host-iax_admin_preauth=") &&
        s.includes("Secure") &&
        !s.includes("Domain="),
    ),
  );
  await request(prod)
    .get("/admin/login")
    .expect(308)
    .expect("Location", "https://iax.example/admin/login");
});
test("authenticated unknown business endpoints remain denied and role input cannot change privileges", async () => {
  const { agent, csrf } = await login();
  for (const route of [
    "/orders",
    "/spk/1",
    "/members/1",
    "/settings",
    "/register",
    "/auth/register",
  ])
    await agent.get("/api/admin" + route).expect(404);
  await agent
    .post("/api/admin/users/1/role")
    .set("Origin", origin)
    .set("X-CSRF-Token", csrf)
    .send({ role: "ADMIN" })
    .expect(404);
  await agent
    .post("/api/admin/auth/logout")
    .set("Origin", origin)
    .set("X-CSRF-Token", csrf)
    .send({ role: "ADMIN" })
    .expect(400);
});
test("production MFA session cookie is host-only, secure and HttpOnly", async () => {
  const secret = generateSecret(),
    username = `prod${++id}`;
  const a = await service.provision({
    username,
    displayName: "Production cookie test",
    password: pw,
    secret,
    operator: "http-test",
  });
  const prod = createApp({
    pool,
    config: {
      ...config,
      production: true,
      origin: "https://iax.example",
      trustProxy: ["loopback"],
    },
  });
  const b = await request(prod)
    .get("/api/admin/auth/csrf")
    .set("X-Forwarded-Proto", "https")
    .expect(200);
  const initial = b.headers["set-cookie"][0].split(";")[0];
  const p = await request(prod)
    .post("/api/admin/auth/login")
    .set("X-Forwarded-Proto", "https")
    .set("Origin", "https://iax.example")
    .set("Cookie", initial)
    .set("X-CSRF-Token", b.body.csrf)
    .send({ username, password: pw })
    .expect(200);
  const pendingCookie = p.headers["set-cookie"][0].split(";")[0];
  const s = await request(prod)
    .post("/api/admin/auth/mfa/verify")
    .set("X-Forwarded-Proto", "https")
    .set("Origin", "https://iax.example")
    .set("Cookie", pendingCookie)
    .set("X-CSRF-Token", p.body.csrf)
    .send({ code: a.recoveryCodes[0] })
    .expect(200);
  const cookie = s.headers["set-cookie"].find((c) =>
    c.startsWith("__Host-iax_admin_session="),
  );
  assert.ok(
    cookie.includes("Secure") &&
      cookie.includes("HttpOnly") &&
      cookie.includes("SameSite=Strict") &&
      cookie.includes("Path=/") &&
      !cookie.includes("Domain="),
  );
  assert.equal(JSON.stringify(s.body).includes("token"), false);
  const untrusted = createApp({
    pool,
    config: {
      ...config,
      production: true,
      origin: "https://iax.example",
      trustProxy: [],
    },
  });
  await request(untrusted)
    .get("/admin")
    .set("X-Forwarded-Proto", "https")
    .expect(308);
});
test("server rejects an existing session if its server-side role is no longer ADMIN", async () => {
  const { agent, a } = await login();
  // Simulate a future/misconfigured non-admin role in the isolated test schema.
  // Public accounts have no way to create this state in the real admin schema.
  await pool.query(
    "ALTER TABLE admin_users MODIFY role ENUM('ADMIN','MEMBER') NOT NULL DEFAULT 'ADMIN'",
  );
  try {
    await pool.execute("UPDATE admin_users SET role='MEMBER' WHERE id=?", [
      a.id,
    ]);
    await agent.get("/api/admin/auth/me").expect(403);
  } finally {
    await pool.execute("UPDATE admin_users SET role='ADMIN' WHERE id=?", [
      a.id,
    ]);
    await pool.query(
      "ALTER TABLE admin_users MODIFY role ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN'",
    );
  }
});
test("database outages return generic errors and fail closed", async () => {
  const dead = mysql.createPool({
    host: "127.0.0.1",
    port: 1,
    user: "unavailable",
    connectTimeout: 100,
  });
  try {
    const broken = createApp({ pool: dead, config });
    const res = await request(broken)
      .get("/api/admin/auth/me")
      .set("Cookie", "iax_admin_session_dev=forged");
    assert.equal(res.status, 500);
    assert.deepEqual(res.body, {
      message: "Layanan sementara tidak tersedia.",
    });
  } finally {
    await dead.end();
  }
});
