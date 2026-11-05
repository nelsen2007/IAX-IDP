-- MySQL >= 8.0.16. UTC timestamps; DECIMAL for roleplay currency.
CREATE TABLE users (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(254) NOT NULL,
 password_hash VARCHAR(255) NULL COMMENT 'NULL means account cannot authenticate',
 role ENUM('member','sales','admin') NOT NULL DEFAULT 'member',
 status ENUM('active','inactive') NOT NULL DEFAULT 'active',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;
CREATE TABLE member_profiles (
 user_id BIGINT UNSIGNED PRIMARY KEY,
 citizen_id VARCHAR(40) NOT NULL,
 phone_rp VARCHAR(40) NULL,
 UNIQUE KEY uq_member_citizen (citizen_id),
 CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE sales_profiles (
 user_id BIGINT UNSIGNED PRIMARY KEY,
 sales_code VARCHAR(40) NOT NULL,
 UNIQUE KEY uq_sales_code (sales_code),
 CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE brands (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 slug VARCHAR(120) NOT NULL,
 logo_url VARCHAR(500) NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE KEY uq_brand_name (name), UNIQUE KEY uq_brand_slug (slug)
) ENGINE=InnoDB;
CREATE TABLE categories (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(80) NOT NULL,
 slug VARCHAR(100) NOT NULL,
 UNIQUE KEY uq_category_name (name), UNIQUE KEY uq_category_slug (slug)
) ENGINE=InnoDB;
CREATE TABLE vehicles (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 brand_id BIGINT UNSIGNED NOT NULL,
 category_id BIGINT UNSIGNED NOT NULL,
 slug VARCHAR(180) NOT NULL,
 name VARCHAR(150) NOT NULL,
 description TEXT NULL,
 price DECIMAL(18,2) NOT NULL,
 stock INT UNSIGNED NOT NULL DEFAULT 0,
 badge ENUM('new_arrival','limited_edition') NULL,
 status ENUM('draft','active','inactive') NOT NULL DEFAULT 'draft',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_vehicle_slug (slug),
 KEY idx_vehicle_catalog (status,brand_id,category_id,price),
 KEY idx_vehicle_category_price (category_id,price),
 KEY idx_vehicle_price (price),
 FULLTEXT KEY idx_vehicle_search (name,description),
 CONSTRAINT chk_vehicle_price CHECK (price >= 0),
 CONSTRAINT fk_vehicle_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT,
 CONSTRAINT fk_vehicle_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE vehicle_images (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 vehicle_id BIGINT UNSIGNED NOT NULL,
 image_url VARCHAR(500) NOT NULL,
 alt_text VARCHAR(255) NOT NULL,
 sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
 UNIQUE KEY uq_vehicle_image_order (vehicle_id,sort_order),
 CONSTRAINT fk_image_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE vehicle_colors (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 vehicle_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(80) NOT NULL,
 hex_color CHAR(7) NOT NULL,
 image_url VARCHAR(500) NULL,
 UNIQUE KEY uq_vehicle_color (vehicle_id,name),
 UNIQUE KEY uq_color_vehicle_id (id,vehicle_id),
 CONSTRAINT chk_hex_color CHECK (hex_color REGEXP '^#[0-9A-Fa-f]{6}$'),
 CONSTRAINT fk_color_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE vehicle_specifications (
 vehicle_id BIGINT UNSIGNED PRIMARY KEY,
 engine VARCHAR(120) NULL,
 power_hp SMALLINT UNSIGNED NULL,
 torque_nm SMALLINT UNSIGNED NULL,
 transmission VARCHAR(100) NULL,
 drivetrain VARCHAR(50) NULL,
 top_speed_kmh SMALLINT UNSIGNED NULL,
 acceleration_seconds DECIMAL(5,2) NULL,
 passenger_capacity TINYINT UNSIGNED NULL,
 CONSTRAINT chk_acceleration CHECK (acceleration_seconds IS NULL OR acceleration_seconds > 0),
 CONSTRAINT chk_capacity CHECK (passenger_capacity IS NULL OR passenger_capacity > 0),
 CONSTRAINT fk_spec_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE vehicle_features (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 vehicle_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(160) NOT NULL,
 UNIQUE KEY uq_vehicle_feature (vehicle_id,name),
 CONSTRAINT fk_feature_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE orders (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_number VARCHAR(40) NOT NULL,
 member_id BIGINT UNSIGNED NOT NULL,
 sales_id BIGINT UNSIGNED NULL,
 vehicle_id BIGINT UNSIGNED NOT NULL,
 color_id BIGINT UNSIGNED NULL,
 variant VARCHAR(120) NULL,
 vehicle_name_snapshot VARCHAR(255) NOT NULL,
 color_name_snapshot VARCHAR(80) NULL,
 price_snapshot DECIMAL(18,2) NOT NULL,
 status ENUM('new','processing','spk_created','completed','cancelled') NOT NULL DEFAULT 'new',
 notes TEXT NULL,
 ordered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_order_number (order_number),
 KEY idx_order_member_date (member_id,ordered_at),
 KEY idx_order_sales_status_date (sales_id,status,ordered_at),
 KEY idx_order_status_date (status,ordered_at),
 KEY idx_order_color_vehicle (color_id,vehicle_id),
 CONSTRAINT chk_order_price CHECK (price_snapshot >= 0),
 CONSTRAINT fk_order_member FOREIGN KEY (member_id) REFERENCES member_profiles(user_id) ON DELETE RESTRICT,
 CONSTRAINT fk_order_sales FOREIGN KEY (sales_id) REFERENCES sales_profiles(user_id) ON DELETE RESTRICT,
 CONSTRAINT fk_order_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
 CONSTRAINT fk_order_color FOREIGN KEY (color_id,vehicle_id) REFERENCES vehicle_colors(id,vehicle_id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE order_status_history (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_id BIGINT UNSIGNED NOT NULL,
 status ENUM('new','processing','spk_created','completed','cancelled') NOT NULL,
 changed_by BIGINT UNSIGNED NULL,
 notes VARCHAR(500) NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_history_order_date (order_id,created_at),
 CONSTRAINT fk_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
 CONSTRAINT fk_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE spk (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 spk_number VARCHAR(40) NOT NULL,
 order_id BIGINT UNSIGNED NOT NULL,
 sales_id BIGINT UNSIGNED NOT NULL,
 customer_name_snapshot VARCHAR(120) NOT NULL,
 citizen_id_snapshot VARCHAR(40) NOT NULL,
 vehicle_name_snapshot VARCHAR(255) NOT NULL,
 variant_snapshot VARCHAR(120) NULL,
 color_snapshot VARCHAR(80) NULL,
 sales_name_snapshot VARCHAR(120) NOT NULL,
 vehicle_price DECIMAL(18,2) NOT NULL,
 discount DECIMAL(18,2) NOT NULL DEFAULT 0,
 down_payment DECIMAL(18,2) NOT NULL DEFAULT 0,
 balance_due DECIMAL(18,2) GENERATED ALWAYS AS (vehicle_price-discount-down_payment) STORED,
 status ENUM('draft','issued','cancelled') NOT NULL DEFAULT 'draft',
 notes TEXT NULL,
 issued_at DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_spk_number (spk_number), UNIQUE KEY uq_spk_order (order_id),
 KEY idx_spk_sales_status (sales_id,status),
 CONSTRAINT chk_spk_amounts CHECK (vehicle_price >= 0 AND discount >= 0 AND down_payment >= 0 AND discount+down_payment <= vehicle_price),
 CONSTRAINT chk_spk_issued_at CHECK (status <> 'issued' OR issued_at IS NOT NULL),
 CONSTRAINT fk_spk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
 CONSTRAINT fk_spk_sales FOREIGN KEY (sales_id) REFERENCES sales_profiles(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE site_settings (
 setting_key VARCHAR(100) PRIMARY KEY,
 setting_value JSON NOT NULL,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
