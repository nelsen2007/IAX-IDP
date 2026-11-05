import { readFile, unlink } from "node:fs/promises";
export default async function teardown() {
  const fixture = JSON.parse(
    await readFile(".superpowers/browser-fixture.json", "utf8"),
  );
  if (!/^iax_admin_browser_test_[a-f0-9]{12}$/.test(fixture.database))
    throw new Error("Refusing to clean an unexpected database.");
  // Existing migration helper loads ignored local database credentials.
  // @ts-expect-error Node ESM helper has no TypeScript declaration.
  const { connect } = await import("../../scripts/db/connection.mjs");
  const connection = await connect(false);
  try {
    await connection.query(`DROP DATABASE \`${fixture.database}\``);
  } finally {
    await connection.end();
    await unlink(".superpowers/browser-fixture.json");
  }
}
