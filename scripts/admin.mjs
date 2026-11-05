import { input, password as hiddenPassword, confirm } from "@inquirer/prompts";
import { userInfo } from "node:os";
import { generateSecret, generateURI } from "otplib";
import { loadConfig } from "../server/config.mjs";
import { createPool } from "../server/db.mjs";
import { createAdminService } from "../server/admin/service.mjs";
import { validatePassword, verifyTotp } from "../server/admin/crypto.mjs";

let pool;
async function getPassword() {
  const value = await hiddenPassword({
    message: "Password (minimum 15 karakter):",
    mask: false,
  });
  validatePassword(value);
  if (
    value !==
    (await hiddenPassword({ message: "Konfirmasi password:", mask: false }))
  )
    throw new Error("Konfirmasi password berbeda.");
  return value;
}
async function enroll(username) {
  const secret = generateSecret();
  console.log(
    "Tambahkan URI berikut pada authenticator di terminal tepercaya. Jangan simpan output terminal.",
  );
  console.log(
    generateURI({ issuer: "IAX 2026 Admin", label: username, secret }),
  );
  const code = await hiddenPassword({
    message: "Kode TOTP untuk mengonfirmasi enrollment:",
    mask: false,
  });
  if ((await verifyTotp(secret, code)) === null)
    throw new Error("Enrollment MFA gagal. Tidak ada perubahan disimpan.");
  return secret;
}
try {
  if (process.argv.length !== 3)
    throw new Error(
      "Gunakan npm run admin:<action>. Kredensial tidak boleh menjadi argumen CLI.",
    );
  const action = process.argv[2];
  if (
    ![
      "create",
      "disable",
      "enable",
      "reset-password",
      "revoke-sessions",
      "reset-mfa",
    ].includes(action)
  )
    throw new Error("Aksi developer tidak dikenal.");
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error("Provisioning memerlukan terminal interaktif tepercaya.");
  const config = loadConfig();
  pool = createPool();
  const service = createAdminService(pool, config);
  const username = (await input({ message: "Username:" })).trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username))
    throw new Error(
      "Username harus 3–64 karakter: a-z, 0-9, titik, underscore, dash.",
    );
  const operator = userInfo().username.slice(0, 120);
  let result;
  if (action === "create") {
    const [existing] = await pool.execute(
      "SELECT id FROM admin_users WHERE username=?",
      [username],
    );
    if (existing.length) throw new Error("Username sudah digunakan.");
    const displayName = await input({ message: "Nama administrator:" });
    const password = await getPassword(),
      secret = await enroll(username);
    result = await service.provision({
      username,
      displayName,
      password,
      secret,
      operator,
    });
  } else {
    if (
      !(await confirm({
        message: `Jalankan ${action} untuk ${username} dan cabut seluruh sesi/challenge?`,
        default: false,
      }))
    )
      process.exit(0);
    const options = {};
    if (action === "reset-password") options.password = await getPassword();
    if (action === "reset-mfa") options.secret = await enroll(username);
    result = await service.manage(username, action, operator, options);
  }
  console.log("Tindakan developer selesai dan tercatat dalam audit log.");
  if (result.recoveryCodes.length)
    console.log(
      "Simpan recovery codes sekali pakai ini di password manager aman. Ditampilkan hanya sekali:\n" +
        result.recoveryCodes.join("\n"),
    );
} catch (error) {
  console.error(
    error.code
      ? "Tindakan gagal. Periksa koneksi, migrasi, atau konflik username."
      : error.message,
  );
  process.exitCode = 1;
} finally {
  await pool?.end();
}
