import { expect, test } from "playwright/test";

test.describe("top bar workspace tabs and menu", () => {
  test("new tab creation - click new tab button, verify tab count increases", async ({ page }) => {
    await page.goto("/");

    const newTabButton = page.getByTestId("solution-tab-new");
    await expect(newTabButton).toBeVisible();

    // Get initial tab count - tabs are buttons with a data-testid containing UUID pattern
    const tabButtons = page.locator('button[data-testid^="solution-tab-wst_"]');
    const initialCount = await tabButtons.count();

    await newTabButton.click();

    await expect.poll(async () => await tabButtons.count()).toBe(initialCount + 1);
  });

  test("tab switching - click different tab, verify active state changes", async ({ page }) => {
    await page.goto("/");

    const newTabButton = page.getByTestId("solution-tab-new");
    await newTabButton.click();

    const tabButtons = page.locator('button[data-testid^="solution-tab-wst_"]');

    await expect.poll(async () => await tabButtons.count()).toBeGreaterThanOrEqual(2);

    const firstTab = tabButtons.first();
    const secondTab = tabButtons.nth(1);

    await expect(firstTab).toBeVisible();
    await expect(secondTab).toBeVisible();

    const firstTabContainer = firstTab.locator('..');
    const secondTabContainer = secondTab.locator('..');

    await secondTab.click();
    await expect(secondTabContainer).toHaveClass(/bg-zinc-800/);

    await firstTab.click();
    await expect(firstTabContainer).toHaveClass(/bg-zinc-800/);
  });

  test("tab close - close inactive tab, verify tab removed", async ({ page }) => {
    await page.goto("/");

    const newTabButton = page.getByTestId("solution-tab-new");
    await newTabButton.click();

    const tabButtons = page.locator('button[data-testid^="solution-tab-wst_"]');
    await expect.poll(async () => await tabButtons.count()).toBeGreaterThanOrEqual(2);

    const secondTab = tabButtons.nth(1);
    const secondTabTestId = await secondTab.getAttribute("data-testid");
    const tabId = secondTabTestId?.replace("solution-tab-", "");
    const closeButton = page.getByTestId(`solution-tab-close-${tabId}`);
    const initialCount = await tabButtons.count();

    await closeButton.click();

    await expect.poll(async () => await tabButtons.count()).toBe(initialCount - 1);
  });

  test("menu open/close - click menu button, verify dropdown opens/closes", async ({ page }) => {
    await page.goto("/");

    const menuButton = page.getByTestId("solution-menu-button");
    await expect(menuButton).toBeVisible();

    await menuButton.click();

    const menuDownloadButton = page.getByTestId("solution-menu-download-json");
    await expect(menuDownloadButton).toBeVisible();

    await menuButton.click();

    await expect(menuDownloadButton).not.toBeVisible();

    await menuButton.click();
    await expect(menuDownloadButton).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menuDownloadButton).not.toBeVisible();
  });

  test("context menu rename - right-click tab, click rename, type new name, verify changed", async ({ page }) => {
    await page.goto("/");

    const tabButton = page.locator('button[data-testid^="solution-tab-wst_"]').first();
    await expect(tabButton).toBeVisible();
    const tabTestId = await tabButton.getAttribute("data-testid");
    const tabId = tabTestId?.replace("solution-tab-", "");

    await tabButton.click({ button: "right" });

    const contextMenu = page.getByTestId("solution-tab-context-menu");
    await expect(contextMenu).toBeVisible();

    const renameButton = page.getByTestId("solution-tab-context-rename");
    await renameButton.click();

    const renameInput = page.getByTestId(`solution-tab-rename-input-${tabId}`);
    await expect(renameInput).toBeVisible();

    await renameInput.fill("Renamed Tab");
    await renameInput.press("Enter");

    await expect(tabButton).toContainText("Renamed Tab");
  });

  test.skip("context menu clone - right-click tab, click clone, verify new tab created", async ({ page }) => {
    await page.goto("/");

    // Get initial tab count
    const tabButtons = page.locator('button[data-testid^="solution-tab-wst_"]');
    const initialCount = await tabButtons.count();
    expect(initialCount).toBeGreaterThanOrEqual(1);

    const tabButton = tabButtons.first();
    await expect(tabButton).toBeVisible();

    // Right-click to open context menu
    await tabButton.click({ button: "right" });

    // Wait for and verify context menu appears
    const contextMenu = page.getByTestId("solution-tab-context-menu");
    await expect(contextMenu).toBeVisible();

    // Find and click the clone button within the context menu
    const cloneButton = contextMenu.getByTestId("solution-tab-context-clone");
    await expect(cloneButton).toBeVisible();

    // Use force click to ensure the button is clicked even if overlapped
    await cloneButton.click({ force: true });

    // Wait for context menu to disappear
    await expect(contextMenu).not.toBeVisible();

    // Verify tab count increased
    await expect.poll(async () => await tabButtons.count(), { timeout: 10000 }).toBe(initialCount + 1);
  });
});
