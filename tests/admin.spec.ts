import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("guests are redirected and public navigation never advertises admin", async ({
  page,
}) => {
  const loginResponse=await page.goto('/admin/login');
  expect(loginResponse?.headers()['cache-control']).toBe('no-store');
  await page.goto("/");
  await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem("role", "ADMIN"));
  for (const route of [
    "/admin",
    "/admin/orders",
    "/admin/spk",
    "/admin/members",
    "/admin/reports",
    "/admin/settings",
    "/admin/dashboard",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByRole("heading", { name: /^Secure access/ }),
    ).toBeVisible();
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "screenshots/admin-login.png",
    fullPage: true,
  });
});

test("administrator display names render as text and cannot execute stored XSS", async ({
  page,
}) => {
  let dialogs = 0;
  page.on("dialog", async (dialog) => {
    dialogs++;
    await dialog.dismiss();
  });
  await login(page, 3);
  await expect(page.locator(".admin-profile strong")).toHaveText(
    "<img src=x onerror=alert(1)>",
  );
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(dialogs).toBe(0);
});

async function login(page: import("@playwright/test").Page, index: number) {
  const data = JSON.parse(
    readFileSync(".superpowers/browser-fixture.json", "utf8"),
  );
  const account = data.accounts[index];
  await page.goto("/admin/login");
  await page.getByLabel("Username", { exact: true }).fill(account.username);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page
    .getByRole("button", { name: "LOGIN TO CONTROL CENTER", exact: true })
    .click();
  await expect(page.getByLabel("Kode TOTP atau recovery code")).toBeVisible();
  const before = await page.request.get("/api/admin/auth/me");
  expect(before.status()).toBe(401);
  await page
    .getByLabel("Kode TOTP atau recovery code")
    .fill(account.recoveryCodes[0]);
  await page
    .getByRole("button", { name: "VERIFIKASI AKSES", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  return account;
}

test("real password plus MFA opens all five modules and logout revokes access", async ({
  page,
}) => {
  await login(page, 0);
  await expect(
    page.getByRole("heading", { name: "IAX Control Center", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("DEMO DATA", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "PESANAN", exact: true }).click();
  await page.getByLabel("Cari pesanan").fill("Alex");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Detail IAX-260040" }).click();
  await expect(page.getByRole("dialog")).toContainText("Alex Morgan");
  await page.getByRole("button", { name: "Proses Pesanan — simulasi" }).click();
  await expect(page.getByRole("status")).toContainText("Simulasi");
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "SPK", exact: true }).click();
  await page
    .getByRole("button", { name: /Lihat SPK/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "SURAT PEMESANAN KENDARAAN",
  );
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".admin-spk-document")).toBeVisible();
  await expect(page.locator(".admin-sidebar")).not.toBeVisible();
  await page
    .locator(".admin-spk-document")
    .screenshot({ path: "screenshots/admin-spk-preview.png" });
  await page.emulateMedia({ media: "screen" });
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "MEMBER", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await page.getByRole("link", { name: "LAPORAN", exact: true }).click();
  await expect(page.getByRole("img", { name: "Tren pemesanan" })).toBeVisible();
  await page.getByRole("link", { name: "PENGATURAN", exact: true }).click();
  await expect(page.getByText("MFA aktif", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  expect((await page.request.get("/api/admin/auth/me")).status()).toBe(401);
});

test("admin is responsive and mobile navigation remains keyboard accessible", async ({
  page,
}) => {
  test.setTimeout(60000);
  await login(page, 1);
  for (const width of [390, 768, 1366, 1920, 2560]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const path of [
      "",
      "/orders",
      "/spk",
      "/members",
      "/reports",
      "/settings",
    ]) {
      await page.goto("/admin" + path);
      await expect(page.locator(".admin-main h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${path} at ${width}`,
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Buka navigasi admin" }).click();
  await page.getByRole("link", { name: "PESANAN", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/orders/);
  await page.screenshot({
    path: "screenshots/admin-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "IAX Control Center", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "screenshots/admin-desktop.png",
    fullPage: true,
  });
});

test("security settings require reauthentication and revoke the current session", async ({
  page,
}) => {
  const account = await login(page, 2);
  await page.goto("/admin/settings");
  await page
    .getByRole("button", { name: "Ubah Password", exact: true })
    .click();
  await page.getByLabel("Password saat ini").fill(account.password);
  await page
    .getByLabel("Password baru", { exact: true })
    .fill(account.password + " changed");
  await page
    .getByLabel("Konfirmasi password baru")
    .fill(account.password + " changed");
  await page
    .getByLabel("Kode MFA untuk verifikasi ulang")
    .fill(account.recoveryCodes[1]);
  await page
    .getByRole("button", { name: "Simpan password dan cabut sesi" })
    .click();
  await expect(page).toHaveURL(/\/admin\/login/);
  expect((await page.request.get("/api/admin/auth/me")).status()).toBe(401);
});
