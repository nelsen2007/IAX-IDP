import { test, expect } from "@playwright/test";
test("public and demo member/sales routes retain their behavior", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/vehicles",
    "/vehicles/porsche-911-gt3",
    "/login",
    "/register",
    "/member/dashboard",
    "/sales/dashboard",
    "/sales/spk/create",
    "/admin/dashboard",
    "/schedule",
    "/about",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("catalog combines filters and recovers from empty results", async ({
  page,
}) => {
  await page.goto("/vehicles");
  await expect(page.locator(".vehicle-card")).toHaveCount(8);
  await page
    .getByRole("textbox", { name: "Cari kendaraan", exact: true })
    .fill("porsche");
  await expect(page.locator(".vehicle-card")).toHaveCount(1);
  await page.getByLabel("Kategori", { exact: true }).selectOption("SUV");
  await expect(page.getByText("Kendaraan belum ditemukan")).toBeVisible();
  await page.getByRole("button", { name: "Reset Pencarian" }).click();
  await expect(page.locator(".vehicle-card")).toHaveCount(8);
});
test("vehicle tabs and demo modal work with keyboard dismissal", async ({
  page,
}) => {
  await page.goto("/vehicles/porsche-911-gt3");
  await page.getByRole("tab", { name: "Spesifikasi", exact: true }).click();
  await expect(page.getByText("650 Nm")).toBeVisible();
  await page.getByRole("button", { name: "Pesan Sekarang" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "pesanan tidak dikirim atau disimpan",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("sales search and date filter narrow actual table rows", async ({
  page,
}) => {
  await page.goto("/sales/dashboard");
  await page.getByLabel("Cari pesanan").fill("Alex");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Filter status").selectOption("Baru");
  await expect(page.getByText("Pesanan tidak ditemukan")).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByLabel("Filter tanggal").fill("2026-11-04");
  await expect(page.locator("tbody tr")).toHaveCount(2);
});
test("SPK preview follows customer input and computes balance", async ({
  page,
}) => {
  await page.goto("/sales/spk/create");
  await page.getByLabel("Nama Pelanggan", { exact: true }).fill("Budi Demo");
  await page.getByLabel("Diskon", { exact: true }).fill("250000");
  await page.getByLabel("DP", { exact: true }).fill("1500000");
  await expect(page.locator(".spk-document")).toContainText("Budi Demo");
  await expect(page.locator(".doc-total")).toContainText("RP $2,500,000");
  await page.getByRole("button", { name: "Tinjau Draft SPK" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "SPK tidak disimpan atau diterbitkan",
  );
});
test("legacy admin route redirects guests to secure login", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByLabel("Username", { exact: true })).toBeVisible();
});
test("mobile navigation and all layouts avoid horizontal page overflow", async ({
  page,
}) => {
  for (const width of [390, 768, 1366, 1920, 2560]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
    for (const route of [
      "/",
      "/vehicles",
      "/vehicles/porsche-911-gt3",
      "/register",
      "/member/dashboard",
      "/sales/dashboard",
      "/sales/spk/create",
      "/admin/dashboard",
    ]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `${route} at ${width}px`,
      ).toBeTruthy();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Buka menu", exact: true }).click();
  await page
    .getByRole("link", { name: "Katalog Kendaraan", exact: true })
    .click();
  await expect(page).toHaveURL(/vehicles/);
});
test("homepage keeps catalog separate and images load", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".vehicle-card")).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "screenshots/home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "screenshots/home-mobile.png",
    fullPage: true,
  });
  await page.goto("/vehicles");
  await page.locator(".vehicle-card img").last().scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".vehicle-card img")
        .evaluateAll((imgs) =>
          imgs.every(
            (img) =>
              (img as HTMLImageElement).complete &&
              (img as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBeTruthy();
});
