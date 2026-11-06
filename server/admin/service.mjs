import {
  opaqueToken,
  tokenHash,
  equalToken,
  validatePassword,
  hashPassword,
  verifyPassword,
  encryptSecret,
  decryptSecret,
  verifyTotp,
} from "./crypto.mjs";

export class AuthError extends Error {
  constructor(status, message = "Akses ditolak.", retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}
const invalid = () => new AuthError(401, "Username atau password tidak valid.");
const requireCsrf = (actual, expected) => {
  if (!equalToken(actual, expected))
    throw new AuthError(403, "Permintaan tidak valid. Muat ulang halaman.");
};
const publicUser = (u) => ({
  id: String(u.id),
  username: u.username,
  displayName: u.display_name,
  role: u.role,
  mfaEnabled: !!u.mfa_enabled,
  lastLoginAt: u.last_login_at,
});

export function createAdminService(pool, config) {
  // Same work factor for unknown accounts. Created lazily without any real account.
  const dummyHash = hashPassword(opaqueToken());
  async function tx(work) {
    const c = await pool.getConnection();
    try {
      await c.beginTransaction();
      const result = await work(c);
      await c.commit();
      return result;
    } catch (e) {
      await c.rollback();
      throw e;
    } finally {
      c.release();
    }
  }
  const one = async (c, sql, args = []) => {
    const [rows] = await c.execute(sql, args);
    return rows[0];
  };
  async function audit(c, id, action, ip = null, metadata = {}) {
    await c.execute(
      "INSERT INTO admin_audit_logs (admin_user_id,action,target_type,target_id,event_metadata,source_ip) VALUES (?,?,?,?,?,?)",
      [
        id,
        action,
        id ? "admin_user" : null,
        id ? String(id) : null,
        JSON.stringify(metadata),
        ip,
      ],
    );
  }
  async function throttle(key, limit = 60, progressive = false) {
    const blocked = await tx(async (c) => {
      const h = tokenHash(key);
      await c.execute(
        "INSERT IGNORE INTO admin_rate_limits VALUES (?,0,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))",
        [h],
      );
      const row = await one(
        c,
        "SELECT *, TIMESTAMPDIFF(MICROSECOND,last_attempt_at,UTC_TIMESTAMP(3))/1000000 AS elapsed, TIMESTAMPDIFF(SECOND,window_started_at,UTC_TIMESTAMP(3)) AS age FROM admin_rate_limits WHERE bucket_hash=? FOR UPDATE",
        [h],
      );
      const hits = row.age >= 900 ? 0 : row.hits;
      const delay =
        progressive && hits >= 4 ? Math.min(30, 2 ** Math.min(hits - 4, 5)) : 0;
      if (hits >= limit || row.elapsed < delay)
        return Math.max(
          1,
          hits >= limit ? 900 - row.age : Math.ceil(delay - row.elapsed),
        );
      await c.execute(
        "UPDATE admin_rate_limits SET hits=?, window_started_at=IF(?=0,UTC_TIMESTAMP(3),window_started_at),last_attempt_at=UTC_TIMESTAMP(3) WHERE bucket_hash=?",
        [hits + 1, hits, h],
      );
      return 0;
    });
    if (blocked)
      throw new AuthError(
        429,
        "Terlalu banyak percobaan. Coba kembali nanti.",
        blocked,
      );
  }
  async function bootstrap(ip = "local") {
    await throttle(`bootstrap:${ip}`, 120);
    const token = opaqueToken(),
      csrf = opaqueToken();
    await pool.execute(
      "INSERT INTO admin_auth_challenges (token_hash,csrf_token,phase,expires_at) VALUES (?,?,'bootstrap',DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 5 MINUTE))",
      [tokenHash(token), csrf],
    );
    return { token, csrf };
  }
  async function challenge(c, token, csrf, phase, lock = false) {
    const row = await one(
      c,
      `SELECT *,expires_at>UTC_TIMESTAMP(3) AS fresh FROM admin_auth_challenges WHERE token_hash=?${lock ? " FOR UPDATE" : ""}`,
      [tokenHash(token)],
    );
    if (
      !row ||
      !row.fresh ||
      row.consumed_at ||
      row.phase !== phase ||
      row.attempts >= 5
    )
      throw new AuthError(401, "Verifikasi berakhir. Silakan login kembali.");
    requireCsrf(csrf, row.csrf_token);
    return row;
  }
  async function login({
    token,
    csrf,
    username,
    password,
    ip,
    userAgent: _userAgent,
  }) {
    await challenge(pool, token, csrf, "bootstrap");
    username = username.trim().toLowerCase();
    await throttle(`login-ip:${ip}`, 60);
    await throttle(`login-account-source:${username}:${ip}`, 12, true);
    // Shared account backoff caps cooldown at 30s, without username-only lockout.
    // Rejected requests never advance last_attempt_at or extend the cooldown.
    await throttle(`login-account:${username}`, Infinity, true);
    const u = await one(pool, "SELECT * FROM admin_users WHERE username=?", [
      username,
    ]);
    const valid = await verifyPassword(
      u?.password_hash || (await dummyHash),
      password,
    );
    const result = await tx(async (c) => {
      const current = u
        ? await one(c, "SELECT * FROM admin_users WHERE id=? FOR UPDATE", [
            u.id,
          ])
        : null;
      const b = await challenge(c, token, csrf, "bootstrap", true);
      await c.execute(
        "UPDATE admin_auth_challenges SET consumed_at=UTC_TIMESTAMP(3) WHERE id=?",
        [b.id],
      );
      const ok =
        valid &&
        current?.is_active &&
        current.password_hash === u.password_hash &&
        (current.role === "ADMIN" ? current.mfa_enabled : !current.mfa_enabled);
      await c.execute(
        "INSERT INTO admin_login_attempts (username_identifier,source_ip,success,failure_reason_code) VALUES (?,?,?,?)",
        [tokenHash(username), ip, !!ok, ok ? null : "INVALID_CREDENTIALS"],
      );
      await audit(
        c,
        current?.id || null,
        ok ? "password_verified" : "login_failed",
        ip,
      );
      if (!ok) return null;
      const next = opaqueToken(),
        nextCsrf = opaqueToken();
      if (current.role !== "ADMIN") {
        const sessionToken = opaqueToken(), sessionCsrf = opaqueToken();
        await c.execute(
          "INSERT INTO admin_sessions (admin_user_id,session_token_hash,csrf_token,credential_version,expires_at,ip_address,user_agent) VALUES (?,?,?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 8 HOUR),?,?)",
          [current.id, tokenHash(sessionToken), sessionCsrf, current.credential_version, ip, (_userAgent || "").slice(0, 255)],
        );
        await c.execute("UPDATE admin_users SET last_login_at=UTC_TIMESTAMP(3) WHERE id=?", [current.id]);
        await audit(c, current.id, "login_success", ip);
        return { token: sessionToken, csrf: sessionCsrf, user: publicUser(current), mfaRequired: false };
      }
      await c.execute(
        "INSERT INTO admin_auth_challenges (token_hash,csrf_token,phase,admin_user_id,credential_version,expires_at) VALUES (?,?,'mfa',?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 5 MINUTE))",
        [tokenHash(next), nextCsrf, current.id, current.credential_version],
      );
      return { token: next, csrf: nextCsrf, mfaRequired: true };
    });
    if (!result) throw invalid();
    return result;
  }
  async function consumeFactor(c, u, code) {
    if (!u.mfa_enabled || !u.mfa_secret_encrypted) return false;
    if (/^\d{6}$/.test(code)) {
      const step = await verifyTotp(
        decryptSecret(u.mfa_secret_encrypted, config.encryptionKey),
        code,
        u.mfa_last_step,
      );
      if (step === null) return false;
      await c.execute("UPDATE admin_users SET mfa_last_step=? WHERE id=?", [
        step,
        u.id,
      ]);
      return true;
    }
    if (!/^[a-f0-9]{32}$/.test(code)) return false;
    const [result] = await c.execute(
      "UPDATE admin_mfa_recovery_codes SET used_at=UTC_TIMESTAMP(3) WHERE admin_user_id=? AND code_hash=? AND used_at IS NULL",
      [u.id, tokenHash(code)],
    );
    return result.affectedRows === 1;
  }
  async function verify({ token, csrf, code, ip, userAgent = "" }) {
    await throttle(`mfa-ip:${ip}`, 60);
    const pre = await challenge(pool, token, csrf, "mfa");
    const result = await tx(async (c) => {
      const u = await one(
        c,
        "SELECT * FROM admin_users WHERE id=? FOR UPDATE",
        [pre.admin_user_id],
      );
      const ch = await challenge(c, token, csrf, "mfa", true);
      if (
        !u?.is_active ||
        u.role !== "ADMIN" ||
        u.credential_version !== ch.credential_version
      )
        return null;
      if (!(await consumeFactor(c, u, code))) {
        await c.execute(
          "UPDATE admin_auth_challenges SET attempts=attempts+1 WHERE id=?",
          [ch.id],
        );
        await audit(c, u.id, "mfa_failed", ip);
        return null;
      }
      await c.execute(
        "UPDATE admin_auth_challenges SET consumed_at=UTC_TIMESTAMP(3) WHERE id=?",
        [ch.id],
      );
      const sessionToken = opaqueToken(),
        sessionCsrf = opaqueToken();
      await c.execute(
        "INSERT INTO admin_sessions (admin_user_id,session_token_hash,csrf_token,credential_version,expires_at,ip_address,user_agent) VALUES (?,?,?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 8 HOUR),?,?)",
        [
          u.id,
          tokenHash(sessionToken),
          sessionCsrf,
          u.credential_version,
          ip,
          userAgent.slice(0, 255),
        ],
      );
      await c.execute(
        "UPDATE admin_users SET last_login_at=UTC_TIMESTAMP(3) WHERE id=?",
        [u.id],
      );
      await audit(c, u.id, "login_success", ip);
      return { token: sessionToken, csrf: sessionCsrf, user: publicUser(u) };
    });
    if (!result)
      throw new AuthError(
        401,
        "Kode verifikasi tidak valid atau sudah digunakan.",
      );
    return result;
  }
  async function lockedSession(c, token, csrf) {
    const pre = await one(
      c,
      "SELECT admin_user_id FROM admin_sessions WHERE session_token_hash=?",
      [tokenHash(token)],
    );
    if (!pre) throw new AuthError(401, "Sesi berakhir. Silakan login kembali.");
    const u = await one(c, "SELECT * FROM admin_users WHERE id=? FOR UPDATE", [
      pre.admin_user_id,
    ]);
    const s = await one(
      c,
      "SELECT *,expires_at>UTC_TIMESTAMP(3) AND last_activity_at>DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 30 MINUTE) AS fresh FROM admin_sessions WHERE session_token_hash=? FOR UPDATE",
      [tokenHash(token)],
    );
    if (
      !u?.is_active ||
      !s?.fresh ||
      s.revoked_at ||
      u.credential_version !== s.credential_version
    )
      throw new AuthError(401, "Sesi berakhir. Silakan login kembali.");
    if (csrf !== undefined) requireCsrf(csrf, s.csrf_token);
    return { u, s };
  }
  async function session(token) {
    return tx(async (c) => {
      const { u, s } = await lockedSession(c, token);
      await c.execute(
        "UPDATE admin_sessions SET last_activity_at=UTC_TIMESTAMP(3) WHERE id=?",
        [s.id],
      );
      return {
        user: publicUser(u),
        csrf: s.csrf_token,
        expiresAt: s.expires_at,
        idleTimeoutMinutes: 30,
      };
    });
  }
  async function revoke(c, u) {
    await c.execute(
      "UPDATE admin_users SET credential_version=credential_version+1 WHERE id=?",
      [u.id],
    );
    await c.execute(
      "UPDATE admin_sessions SET revoked_at=UTC_TIMESTAMP(3) WHERE admin_user_id=? AND revoked_at IS NULL",
      [u.id],
    );
    await c.execute(
      "UPDATE admin_auth_challenges SET consumed_at=UTC_TIMESTAMP(3) WHERE admin_user_id=? AND consumed_at IS NULL",
      [u.id],
    );
  }
  async function logout(token, csrf, ip) {
    await tx(async (c) => {
      const { u, s } = await lockedSession(c, token, csrf);
      await c.execute(
        "UPDATE admin_sessions SET revoked_at=UTC_TIMESTAMP(3) WHERE id=?",
        [s.id],
      );
      await audit(c, u.id, "logout", ip);
    });
  }
  async function sensitive(token, csrf, input, ip, action) {
    const who = await session(token);
    await throttle(`reauth:${who.user.id}:${ip}`, 10, true);
    const result = await tx(async (c) => {
      const { u } = await lockedSession(c, token, csrf);
      if (
        !(await verifyPassword(u.password_hash, input.oldPassword)) ||
        !(await consumeFactor(c, u, input.code))
      ) {
        await audit(c, u.id, "reauth_failed", ip);
        return false;
      }
      if (action === "password_changed") {
        if (input.oldPassword === input.newPassword)
          throw new AuthError(400, "Password baru harus berbeda.");
        await c.execute(
          "UPDATE admin_users SET password_hash=?,password_changed_at=UTC_TIMESTAMP(3) WHERE id=?",
          [await hashPassword(input.newPassword), u.id],
        );
      }
      await revoke(c, u);
      await audit(c, u.id, action, ip);
      return true;
    });
    if (!result) throw new AuthError(401, "Verifikasi ulang gagal.");
  }
  async function changePassword(token, csrf, input, ip) {
    try {
      validatePassword(input.newPassword);
    } catch (e) {
      throw new AuthError(400, e.message);
    }
    return sensitive(token, csrf, input, ip, "password_changed");
  }
  const revokeAll = (token, csrf, input, ip) =>
    sensitive(token, csrf, input, ip, "logout_all");
  async function provision({
    username,
    displayName,
    password,
    secret,
    operator,
  }) {
    if (
      !/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username) ||
      !displayName?.trim() ||
      displayName.length > 120 ||
      !operator ||
      operator.length > 120
    )
      throw new Error("Invalid provisioning input.");
    validatePassword(password);
    const hash = await hashPassword(password);
    const recoveryCodes = Array.from({ length: 10 }, () =>
      opaqueToken().slice(0, 32),
    );
    const id = await tx(async (c) => {
      const [r] = await c.execute(
        "INSERT INTO admin_users (username,display_name,password_hash,mfa_enabled,mfa_secret_encrypted,provisioned_by) VALUES (?,?,?,TRUE,?,?)",
        [
          username,
          displayName.trim(),
          hash,
          encryptSecret(secret, config.encryptionKey),
          operator,
        ],
      );
      for (const code of recoveryCodes)
        await c.execute(
          "INSERT INTO admin_mfa_recovery_codes (admin_user_id,code_hash) VALUES (?,?)",
          [r.insertId, tokenHash(code)],
        );
      await audit(c, r.insertId, "provisioned", null, {
        operator,
        source: "developer-cli",
      });
      return r.insertId;
    });
    return { id, recoveryCodes };
  }
  async function manage(username, action, operator, { password, secret } = {}) {
    if (
      ![
        "disable",
        "enable",
        "reset-password",
        "reset-mfa",
        "revoke-sessions",
      ].includes(action)
    )
      throw new Error("Unknown developer action.");
    if (action === "reset-password") validatePassword(password);
    const recoveryCodes =
      action === "reset-mfa"
        ? Array.from({ length: 10 }, () => opaqueToken().slice(0, 32))
        : [];
    await tx(async (c) => {
      const u = await one(
        c,
        "SELECT * FROM admin_users WHERE username=? FOR UPDATE",
        [username],
      );
      if (!u) throw new Error("Admin tidak ditemukan.");
      await revoke(c, u);
      if (action === "disable" || action === "enable")
        await c.execute("UPDATE admin_users SET is_active=? WHERE id=?", [
          action === "enable",
          u.id,
        ]);
      if (action === "reset-password")
        await c.execute(
          "UPDATE admin_users SET password_hash=?,password_changed_at=UTC_TIMESTAMP(3) WHERE id=?",
          [await hashPassword(password), u.id],
        );
      if (action === "reset-mfa") {
        await c.execute(
          "UPDATE admin_users SET mfa_secret_encrypted=?,mfa_enabled=TRUE,mfa_last_step=-1 WHERE id=?",
          [encryptSecret(secret, config.encryptionKey), u.id],
        );
        await c.execute(
          "DELETE FROM admin_mfa_recovery_codes WHERE admin_user_id=?",
          [u.id],
        );
        for (const code of recoveryCodes)
          await c.execute(
            "INSERT INTO admin_mfa_recovery_codes (admin_user_id,code_hash) VALUES (?,?)",
            [u.id, tokenHash(code)],
          );
      }
      await audit(c, u.id, `developer_${action}`, null, {
        operator,
        source: "developer-cli",
      });
    });
    return { recoveryCodes };
  }
  async function listStaff() {
    const [rows] = await pool.execute(
      "SELECT s.id,s.name,s.steamhex,s.role,s.is_active,s.created_at,a.username FROM staff_accounts s LEFT JOIN admin_users a ON a.id=s.admin_user_id WHERE s.is_active=TRUE ORDER BY s.created_at DESC",
    );
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      steamHex: row.steamhex,
      username: row.username || "legacy",
      role: row.role,
      active: !!row.is_active,
      createdAt: row.created_at,
    }));
  }
  async function createStaff({ name, steamHex, role, username, password, createdBy, ip }) {
    const cleanName = name?.trim();
    const cleanSteamHex = steamHex?.trim().toLowerCase();
    if (!cleanName || cleanName.length > 120)
      throw new AuthError(400, "Nama pengurus tidak valid.");
    if (!/^steam:[0-9a-f]{15,32}$/.test(cleanSteamHex || ""))
      throw new AuthError(400, "SteamHex harus berformat steam: diikuti hex.");
    if (!["ADMIN", "CASHIER", "SALES"].includes(role))
      throw new AuthError(400, "Role pengurus tidak valid.");
    if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username?.trim().toLowerCase() || ""))
      throw new AuthError(400, "Username tidak valid.");
    if (typeof password !== "string" || password.length < 1 || password.length > 1024)
      throw new AuthError(400, "Password wajib diisi.");
    try {
      username = username.trim().toLowerCase();
      const hash = await hashPassword(password);
      const result = await tx(async (c) => {
        const [account] = await c.execute(
          "INSERT INTO admin_users (username,display_name,password_hash,role,mfa_enabled,steamhex,provisioning_source,provisioned_by) VALUES (?,?,?, ?,FALSE,?,?,?)",
          [username, cleanName, hash, role, cleanSteamHex, "staff-panel", String(createdBy)],
        );
        const [staff] = await c.execute(
          "INSERT INTO staff_accounts (admin_user_id,name,steamhex,role,created_by) VALUES (?,?,?,?,?)",
          [account.insertId, cleanName, cleanSteamHex, role, createdBy],
        );
        await audit(c, createdBy, "staff_created", ip, { staffId: String(staff.insertId), role });
        return { staffId: staff.insertId, accountId: account.insertId };
      });
      return {
        id: String(result.staffId),
        name: cleanName,
        steamHex: cleanSteamHex,
        username,
        role,
        active: true,
      };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY")
        throw new AuthError(409, "Username atau SteamHex tersebut sudah terdaftar.");
      throw error;
    }
  }
  async function removeStaff({ id, operator, ip }) {
    await tx(async (c) => {
      const staff = await one(c, "SELECT admin_user_id FROM staff_accounts WHERE id=? FOR UPDATE", [id]);
      if (!staff) throw new AuthError(404, "Pengurus tidak ditemukan.");
      await c.execute("UPDATE admin_users SET is_active=FALSE, credential_version=credential_version+1 WHERE id=?", [staff.admin_user_id]);
      await c.execute("UPDATE admin_sessions SET revoked_at=UTC_TIMESTAMP(3) WHERE admin_user_id=? AND revoked_at IS NULL", [staff.admin_user_id]);
      await c.execute("UPDATE staff_accounts SET is_active=FALSE WHERE id=?", [id]);
      await audit(c, operator, "staff_removed", ip, { staffId: String(id) });
    });
  }
  return {
    bootstrap,
    login,
    verify,
    session,
    logout,
    changePassword,
    revokeAll,
    provision,
    manage,
    listStaff,
    createStaff,
    removeStaff,
    throttle,
  };
}
