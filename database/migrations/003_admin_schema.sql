-- Independent admin identities. No accounts or credentials are seeded.
CREATE TABLE admin_users (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 username VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 display_name VARCHAR(120) NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 role ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 mfa_secret_encrypted TEXT NULL,
 mfa_last_step BIGINT NOT NULL DEFAULT -1,
 credential_version INT UNSIGNED NOT NULL DEFAULT 1,
 password_changed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 last_login_at DATETIME(3) NULL,
 provisioning_source VARCHAR(80) NOT NULL DEFAULT 'developer-cli',
 provisioned_by VARCHAR(120) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;
CREATE TABLE admin_sessions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 admin_user_id BIGINT UNSIGNED NOT NULL,
 session_token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 csrf_token CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 credential_version INT UNSIGNED NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 last_activity_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 expires_at DATETIME(3) NOT NULL,
 revoked_at DATETIME(3) NULL,
 ip_address VARCHAR(45) NOT NULL,
 user_agent VARCHAR(255) NOT NULL,
 KEY idx_admin_session_user (admin_user_id,revoked_at),
 KEY idx_admin_session_expiry (expires_at),
 CONSTRAINT fk_admin_session_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE admin_auth_challenges (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 csrf_token CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 phase ENUM('bootstrap','mfa') NOT NULL,
 admin_user_id BIGINT UNSIGNED NULL,
 credential_version INT UNSIGNED NULL,
 attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
 expires_at DATETIME(3) NOT NULL,
 consumed_at DATETIME(3) NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 KEY idx_admin_challenge_expiry (expires_at),
 KEY idx_admin_challenge_user (admin_user_id,consumed_at),
 CONSTRAINT fk_admin_challenge_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE admin_login_attempts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 username_identifier CHAR(64) NOT NULL,
 source_ip VARCHAR(45) NOT NULL,
 success BOOLEAN NOT NULL,
 attempted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 failure_reason_code VARCHAR(40) NULL,
 KEY idx_admin_attempt_date (attempted_at),
 KEY idx_admin_attempt_identifier (username_identifier,attempted_at),
 KEY idx_admin_attempt_source (source_ip,attempted_at)
) ENGINE=InnoDB;
CREATE TABLE admin_audit_logs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 admin_user_id BIGINT UNSIGNED NULL,
 action VARCHAR(80) NOT NULL,
 target_type VARCHAR(40) NULL,
 target_id VARCHAR(64) NULL,
 event_metadata JSON NOT NULL,
 source_ip VARCHAR(45) NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 KEY idx_admin_audit_date (created_at),
 KEY idx_admin_audit_user (admin_user_id,created_at),
 CONSTRAINT fk_admin_audit_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE admin_mfa_recovery_codes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 admin_user_id BIGINT UNSIGNED NOT NULL,
 code_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 used_at DATETIME(3) NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 KEY idx_admin_recovery_user (admin_user_id,used_at),
 CONSTRAINT fk_admin_recovery_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE admin_rate_limits (
 bucket_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 hits INT UNSIGNED NOT NULL,
 window_started_at DATETIME(3) NOT NULL,
 last_attempt_at DATETIME(3) NOT NULL,
 KEY idx_admin_rate_expiry (window_started_at)
) ENGINE=InnoDB;
