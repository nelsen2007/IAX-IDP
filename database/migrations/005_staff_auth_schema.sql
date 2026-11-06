ALTER TABLE staff_accounts
  ADD COLUMN admin_user_id BIGINT UNSIGNED NULL UNIQUE AFTER id,
  ADD CONSTRAINT fk_staff_admin_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE RESTRICT;
