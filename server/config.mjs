import { existsSync } from "node:fs";
for (const name of [".env.database.local", ".env.admin.local"])
  if (existsSync(name)) process.loadEnvFile(name);
export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const origin =
    env.ADMIN_ORIGIN || (production ? "" : "http://127.0.0.1:5173");
  const url = new URL(origin);
  if (url.origin !== origin || (production && url.protocol !== "https:"))
    throw new Error(
      "ADMIN_ORIGIN must be an exact HTTPS origin in production.",
    );
  const raw = env.ADMIN_MFA_ENCRYPTION_KEY;
  if (!raw || !/^[0-9a-f]{64}$/i.test(raw))
    throw new Error(
      "ADMIN_MFA_ENCRYPTION_KEY must be 32 random bytes encoded as 64 hex characters.",
    );
  const port = Number(env.ADMIN_PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid ADMIN_PORT");
  const trustProxy = (env.ADMIN_TRUST_PROXY || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (trustProxy.some((s) => s === "true" || /^\d+$/.test(s)))
    throw new Error(
      "ADMIN_TRUST_PROXY must list explicit trusted IP addresses/CIDRs.",
    );
  return {
    production,
    origin,
    encryptionKey: Buffer.from(raw, "hex"),
    port,
    host: env.ADMIN_HOST || "127.0.0.1",
    trustProxy,
  };
}
