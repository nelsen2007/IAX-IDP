import { test, expect } from "@playwright/test";

for (const register of [true, false]) {
  test(`${register ? "registration" : "login"} requires the requested fields before opening the demo`, async ({ page }) => {
    await page.goto(register ? "/register" : "/login");
    const form = page.locator("form");
    await expect(form.locator("input")).toHaveCount(register ? 4 : 2);
    if (register) {
      await page.getByLabel("Nama", { exact: true }).fill("Raka Pratama");
      await page.getByLabel("SteamHEX", { exact: true }).fill("steam:110000112345678");
    }
    await page.getByLabel("Password", { exact: true }).fill("contoh123");
    await form.getByRole("button", { name: register ? "Daftar Member" : "Masuk", exact: true }).click();
    await expect(page).toHaveURL(register ? /\/register$/ : /\/login$/);
    await page.getByLabel("Nomor Hape", { exact: true }).fill("081234567890");
    await form.getByRole("button", { name: register ? "Daftar Member" : "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/member\/dashboard$/);
  });
}
