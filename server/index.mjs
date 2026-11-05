import { loadConfig } from "./config.mjs";
import { createPool } from "./db.mjs";
import { createApp } from "./app.mjs";
try {
  const config = loadConfig(),
    pool = createPool();
  await pool.execute("SELECT id FROM admin_users LIMIT 1");
  const server = createApp({ pool, config }).listen(
    config.port,
    config.host,
    () =>
      console.log(`Admin backend listening on ${config.host}:${config.port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(async () => {
        await pool.end();
        process.exit(0);
      }),
    );
} catch {
  console.error(
    "Backend gagal dimulai. Periksa konfigurasi environment, koneksi MySQL, dan migrasi admin.",
  );
  process.exitCode = 1;
}
