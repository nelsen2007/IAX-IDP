import argon2 from "argon2";
import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
} from "node:crypto";
import { verify } from "otplib";

export const opaqueToken = () => randomBytes(32).toString("hex");
export const tokenHash = (value) =>
  createHash("sha256")
    .update(String(value || ""))
    .digest("hex");
export function equalToken(a, b) {
  return (
    typeof a === "string" &&
    typeof b === "string" &&
    a.length === b.length &&
    timingSafeEqual(Buffer.from(a), Buffer.from(b))
  );
}
export function validatePassword(value) {
  if (
    typeof value !== "string" ||
    [...value].length < 15 ||
    Buffer.byteLength(value) > 1024
  )
    throw new Error(
      "Password harus 15–1024 karakter/byte dan mendukung passphrase.",
    );
  const common = new Set([
    "passwordpassword",
    "123456789012345",
    "1234567890123456",
    "qwertyuiopasdfgh",
    "adminadminadmin",
    "indoprideindopride",
  ]);
  if (common.has(value.toLowerCase()) || /^(.)\1+$/.test(value))
    throw new Error("Gunakan passphrase unik yang lebih kuat.");
}
export const hashPassword = (value) =>
  argon2.hash(value, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
export async function verifyPassword(hash, value) {
  try {
    return await argon2.verify(hash, value);
  } catch {
    return false;
  }
}
export function encryptSecret(secret, key) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    data.toString("base64"),
  ].join(".");
}
export function decryptSecret(encrypted, key) {
  const [version, iv, tag, data] = encrypted.split(".");
  if (version !== "v1") throw new Error("Unsupported secret version");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64"),
  );
  cipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    cipher.update(Buffer.from(data, "base64")),
    cipher.final(),
  ]).toString("utf8");
}
export async function verifyTotp(secret, code, lastStep = -1) {
  if (!/^\d{6}$/.test(code)) return null;
  const result = await verify({
    secret,
    token: code,
    epochTolerance: 30,
    ...(Number(lastStep) >= 0 ? { afterTimeStep: Number(lastStep) } : {}),
  });
  return result.valid ? result.timeStep : null;
}
