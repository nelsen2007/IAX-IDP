import mysql from "mysql2/promise";
export function createPool(env = process.env) {
  if (!env.MYSQL_USER) throw new Error("MYSQL_USER is required.");
  const pool = mysql.createPool({
    host: env.MYSQL_HOST || "127.0.0.1",
    port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD || "",
    database: env.MYSQL_DATABASE || "iax_2026",
    timezone: "Z",
    charset: "utf8mb4",
    connectionLimit: 10,
    multipleStatements: false,
    connectTimeout: 5000,
  });
  // mysql2 timezone controls JS conversion only; SQL defaults also need UTC.
  // Enqueue initialization before the new connection is handed to its caller.
  pool.on("connection", (connection) => {
    connection.query("SET SESSION time_zone = '+00:00'", (error) => {
      if (error) connection.destroy();
    });
  });
  return pool;
}
