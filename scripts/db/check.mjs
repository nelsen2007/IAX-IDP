import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connect, database, reportError } from "./connection.mjs";
let connection;
try {
  connection = await connect();
  const [counts] = await connection.query(
    `SELECT 'vehicles' AS entity, COUNT(*) AS total FROM vehicles UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'orders',COUNT(*) FROM orders UNION ALL SELECT 'spk',COUNT(*) FROM spk`,
  );
  console.table(counts);
  const [[schema]] = await connection.execute(
    "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema=?",
    [database],
  );
  assert.equal(
    Number(schema.total),
    22,
    "Expected 14 public tables, 7 admin security tables, and migration history",
  );
  const [[seed]] = await connection.query(
    "SELECT COUNT(*) AS total FROM vehicles WHERE slug IN ('porsche-911-gt3','mercedes-amg-gt','bmw-m4','lamborghini-huracan','range-rover-sport','ford-raptor','audi-r8','ducati-panigale')",
  );
  assert.equal(Number(seed.total), 8, "Expected all eight prototype vehicles");
  const [[accounts]] = await connection.query(
    "SELECT COUNT(*) AS total FROM users WHERE email IN ('sales@example.com','admin@example.com') AND password_hash IS NULL",
  );
  assert.equal(
    Number(accounts.total),
    2,
    "Seed accounts must not have a usable password",
  );
  await connection.beginTransaction();
  const unique = randomUUID().replaceAll("-", "");
  const [user] = await connection.execute(
    "INSERT INTO users (name,email,role) VALUES ('DB Verification',?,'member')",
    [`verify-${unique}@example.com`],
  );
  await connection.execute(
    "INSERT INTO member_profiles (user_id,citizen_id) VALUES (?,?)",
    [user.insertId, `TEST-${unique}`],
  );
  const [[vehicle]] = await connection.query(
    "SELECT id,brand_id,category_id FROM vehicles WHERE slug='porsche-911-gt3'",
  );
  const [[sales]] = await connection.query(
    "SELECT user_id FROM sales_profiles WHERE sales_code='SALES-001'",
  );
  const reject = async (sql, args, code) => {
    await assert.rejects(
      connection.execute(sql, args),
      (error) => error.code === code,
    );
  };
  await reject(
    "INSERT INTO users (name,email) VALUES ('Duplicate',?)",
    [`verify-${unique}@example.com`],
    "ER_DUP_ENTRY",
  );
  await reject(
    "INSERT INTO vehicles (brand_id,category_id,slug,name,price) VALUES (?,?,?,?,?)",
    [
      vehicle.brand_id,
      vehicle.category_id,
      `verify-${unique}`,
      "Invalid negative price",
      -1,
    ],
    "ER_CHECK_CONSTRAINT_VIOLATED",
  );
  await reject(
    "INSERT INTO member_profiles (user_id,citizen_id) VALUES (?,?)",
    [0, `INVALID-${unique}`],
    "ER_NO_REFERENCED_ROW_2",
  );
  const [order] = await connection.execute(
    "INSERT INTO orders (order_number,member_id,sales_id,vehicle_id,vehicle_name_snapshot,price_snapshot) VALUES (?,?,?,?,?,?)",
    [
      `TEST-${unique}`,
      user.insertId,
      sales.user_id,
      vehicle.id,
      "Verification Vehicle",
      4250000,
    ],
  );
  const spkSql =
    "INSERT INTO spk (spk_number,order_id,sales_id,customer_name_snapshot,citizen_id_snapshot,vehicle_name_snapshot,sales_name_snapshot,vehicle_price,discount,down_payment) VALUES (?,?,?,?,?,?,?,?,?,?)";
  const args = [
    `TEST-${unique}`,
    order.insertId,
    sales.user_id,
    "DB Verification",
    `TEST-${unique}`,
    "Verification Vehicle",
    "Sales Verification",
    4250000,
    250000,
    1500000,
  ];
  await reject(
    spkSql,
    [...args.slice(0, 9), 5000000],
    "ER_CHECK_CONSTRAINT_VIOLATED",
  );
  await connection.execute(spkSql, args);
  const [[spk]] = await connection.execute(
    "SELECT balance_due FROM spk WHERE order_id=?",
    [order.insertId],
  );
  assert.equal(
    spk.balance_due,
    "2500000.00",
    "Generated balance must use exact decimal arithmetic",
  );
  await reject(
    "UPDATE spk SET status='issued' WHERE order_id=?",
    [order.insertId],
    "ER_CHECK_CONSTRAINT_VIOLATED",
  );
  const [[otherColor]] = await connection.query(
    "SELECT id FROM vehicle_colors WHERE vehicle_id <> ? LIMIT 1",
    [vehicle.id],
  );
  await reject(
    "UPDATE orders SET color_id=? WHERE id=?",
    [otherColor.id, order.insertId],
    "ER_NO_REFERENCED_ROW_2",
  );
  await reject(
    "DELETE FROM vehicles WHERE id=?",
    [vehicle.id],
    "ER_ROW_IS_REFERENCED_2",
  );
  await connection.rollback();
  const [[rolledBack]] = await connection.execute(
    "SELECT COUNT(*) AS total FROM users WHERE email=?",
    [`verify-${unique}@example.com`],
  );
  assert.equal(
    Number(rolledBack.total),
    0,
    "Verification fixtures must not persist",
  );
  console.log(
    "PASS: tables, seeds, disabled demo logins, uniqueness, FK integrity, price checks, SPK balance, cross-vehicle color protection, issued timestamp, delete protection, and test rollback.",
  );
} catch (error) {
  if (connection) await connection.rollback().catch(() => {});
  reportError(error);
} finally {
  if (connection) await connection.end();
}
