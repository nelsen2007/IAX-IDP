import { loadConfig } from "../server/config.mjs";
import { createPool } from "../server/db.mjs";
loadConfig();
const pool = createPool();
try {
  await pool.execute(
    "DELETE FROM admin_auth_challenges WHERE expires_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 DAY)",
  );
  await pool.execute(
    "DELETE FROM admin_rate_limits WHERE window_started_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 DAY)",
  );
  await pool.execute(
    "DELETE FROM admin_sessions WHERE expires_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 30 DAY)",
  );
  await pool.execute(
    "DELETE FROM admin_login_attempts WHERE attempted_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 90 DAY)",
  );
  await pool.execute(
    "DELETE FROM admin_audit_logs WHERE created_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 365 DAY)",
  );
  console.log(
    "Retensi admin selesai: challenge/rate 1 hari, sesi 30 hari, attempts 90 hari, audit 365 hari.",
  );
} catch {
  console.error("Cleanup gagal. Periksa konfigurasi database.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
