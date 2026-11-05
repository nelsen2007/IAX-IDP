import { writeFileSync } from "node:fs";
import { vehicles, orders } from "../../src/data/mock.ts";
const q = (v) => (v == null ? "NULL" : `'${String(v).replaceAll("'", "''")}'`);
const slug = (s) =>
  s
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
const statements = [
  "-- Illustrative seed data only. Demo accounts have NULL password hashes and cannot log in.",
];
const brands = [...new Set(vehicles.map((v) => v.brand))];
const categories = [...new Set(vehicles.map((v) => v.category))];
brands.forEach((b, i) =>
  statements.push(
    `INSERT INTO brands (id,name,slug) VALUES (${i + 1},${q(b)},${q(slug(b))});`,
  ),
);
categories.forEach((c, i) =>
  statements.push(
    `INSERT INTO categories (id,name,slug) VALUES (${i + 1},${q(c)},${q(slug(c))});`,
  ),
);
vehicles.forEach((v, i) => {
  const id = i + 1;
  statements.push(
    `INSERT INTO vehicles (id,brand_id,category_id,slug,name,description,price,stock,badge,status) VALUES (${id},${brands.indexOf(v.brand) + 1},${categories.indexOf(v.category) + 1},${q(v.slug)},${q(v.name)},'Kendaraan ilustratif prototype IAX 2026.',${v.price},3,${q(v.badge === "Limited Edition" ? "limited_edition" : "new_arrival")},'active');`,
  );
  statements.push(
    `INSERT INTO vehicle_images (vehicle_id,image_url,alt_text,sort_order) VALUES (${id},${q(v.image)},${q(v.brand + " " + v.name + " (foto ilustratif)")},0);`,
  );
  [
    ["Silver Metallic", "#a9acab"],
    ["Racing Green", "#18372c"],
    ["Obsidian Black", "#171819"],
  ].forEach(([name, color]) =>
    statements.push(
      `INSERT INTO vehicle_colors (vehicle_id,name,hex_color) VALUES (${id},${q(name)},${q(color)});`,
    ),
  );
  // Seed only known mock fields; do not invent model-specific mechanical specifications.
  statements.push(
    `INSERT INTO vehicle_specifications (vehicle_id,power_hp,transmission) VALUES (${id},${v.power},'Automatic');`,
  );
  statements.push(
    `INSERT INTO vehicle_features (vehicle_id,name) VALUES (${id},'Digital cockpit (fitur ilustratif)');`,
  );
});
orders.forEach((o, i) => {
  statements.push(
    `INSERT INTO users (id,name,email,role) VALUES (${i + 1},${q(o.member)},${q("member" + (i + 1) + "@example.com")},'member');`,
  );
  statements.push(
    `INSERT INTO member_profiles (user_id,citizen_id) VALUES (${i + 1},${q(o.citizen)});`,
  );
});
statements.push(
  "INSERT INTO users (id,name,email,role) VALUES (6,'Ardi Putra','sales@example.com','sales'),(7,'Administrator','admin@example.com','admin');",
);
statements.push(
  "INSERT INTO sales_profiles (user_id,sales_code) VALUES (6,'SALES-001');",
);
const statuses = {
  Baru: "new",
  Diproses: "processing",
  "SPK Dibuat": "spk_created",
  Selesai: "completed",
  Dibatalkan: "cancelled",
};
orders.forEach((o, i) => {
  const vehicleIndex = vehicles.findIndex((v) => v.name === o.vehicle);
  const v = vehicles[vehicleIndex];
  statements.push(
    `INSERT INTO orders (id,order_number,member_id,sales_id,vehicle_id,variant,vehicle_name_snapshot,color_name_snapshot,price_snapshot,status,ordered_at) VALUES (${i + 1},${q(o.id)},${i + 1},${o.status === "Baru" ? "NULL" : 6},${vehicleIndex + 1},'Performance',${q(v.brand + " " + v.name)},'Silver Metallic',${v.price},${q(statuses[o.status])},${q(o.date + " 10:00:00")});`,
  );
  statements.push(
    `INSERT INTO order_status_history (order_id,status,changed_by,notes,created_at) VALUES (${i + 1},${q(statuses[o.status])},NULL,'Status awal dari seed prototype, bukan riwayat transaksi nyata.',${q(o.date + " 10:00:00")});`,
  );
  if (["SPK Dibuat", "Selesai"].includes(o.status))
    statements.push(
      `INSERT INTO spk (spk_number,order_id,sales_id,customer_name_snapshot,citizen_id_snapshot,vehicle_name_snapshot,variant_snapshot,color_snapshot,sales_name_snapshot,vehicle_price,discount,down_payment,status,issued_at,notes) VALUES (${q("SPK-2026-00" + (41 - i))},${i + 1},6,${q(o.member)},${q(o.citizen)},${q(v.brand + " " + v.name)},'Performance','Silver Metallic','Ardi Putra',${v.price},0,1000000,'issued',${q(o.date + " 11:00:00")},'Data contoh; bukan dokumen resmi.');`,
    );
});
statements.push(
  `INSERT INTO site_settings (setting_key,setting_value) VALUES ('event',JSON_OBJECT('name','IAX 2026','subtitle','INDOPRIDE AUTO EXPO','slogan','YANG PENTING ADA','mode','prototype','currency','RP $'));`,
);
writeFileSync(
  new URL("../../database/migrations/002_seed.sql", import.meta.url),
  statements.join("\n") + "\n",
);
console.log("Generated database/migrations/002_seed.sql");
