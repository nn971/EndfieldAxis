import { expect, test } from "playwright/test";

test.describe("i18n locale switching smoke tests", () => {
  test("toggle language updates UI immediately", async ({ page }) => {
    await page.goto("/");

    const enButton = page
      .getByTestId("lang-en")
      .or(page.getByRole("button", { name: "EN" }))
      .first();
    const zhButton = page
      .getByTestId("lang-zh-CN")
      .or(page.getByRole("button", { name: "简体中文" }))
      .first();
    const simHeading = page
      .getByTestId("panel-sim")
      .locator("h2")
      .or(page.getByRole("heading", { name: /Simulator|模拟器/ }))
      .first();

    await expect(enButton).toBeVisible();
    await expect(simHeading).toHaveText("Simulator");

    await zhButton.click();
    await expect(simHeading).toHaveText("模拟器");
  });

  test("language persists across reload", async ({ page }) => {
    await page.goto("/");

    const enButton = page
      .getByTestId("lang-en")
      .or(page.getByRole("button", { name: "EN" }))
      .first();
    const zhButton = page
      .getByTestId("lang-zh-CN")
      .or(page.getByRole("button", { name: "简体中文" }))
      .first();
    const simHeading = page
      .getByTestId("panel-sim")
      .locator("h2")
      .or(page.getByRole("heading", { name: /Simulator|模拟器/ }))
      .first();

    await expect(enButton).toBeVisible();
    await zhButton.click();
    await expect(simHeading).toHaveText("模拟器");
    await expect(zhButton).toHaveClass(/bg-zinc-600/);

    await page.reload();

    await expect(simHeading).toHaveText("模拟器");
    await expect(zhButton).toHaveClass(/bg-zinc-600/);
  });

  test("sim log re-localizes after language switch without rerun", async ({
    page,
  }) => {
    await page.goto("/");

    const enButton = page
      .getByTestId("lang-en")
      .or(page.getByRole("button", { name: "EN" }))
      .first();
    const zhButton = page
      .getByTestId("lang-zh-CN")
      .or(page.getByRole("button", { name: "简体中文" }))
      .first();
    const simPanel = page.getByTestId("panel-sim");
    const runButton = page.getByTestId("sim-run");
    const simLog = simPanel.locator("pre").first();
    const simHeading = simPanel.locator("h2").first();

    await enButton.click();
    await expect(simHeading).toHaveText("Simulator");
    await runButton.click();

    await expect(simLog).toContainText("Simulation started.");
    await expect(simLog).toContainText("Simulation ended.");
    await expect(simLog).toContainText("Final world state:");

    await zhButton.click();
    await expect(simHeading).toHaveText("模拟器");

    await expect(simLog).toContainText("模拟开始。", { timeout: 20000 });
    await expect(simLog).toContainText("最终世界状态：", { timeout: 20000 });
    await expect(simLog).not.toContainText("Final world state:", {
      timeout: 20000,
    });
  });
});
