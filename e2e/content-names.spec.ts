import { expect, test } from "playwright/test";

test.describe("content name localization tests", () => {
  test("operator names relocalize across UI surfaces", async ({ page }) => {
    await page.goto("/");

    const enButton = page
      .getByTestId("lang-en")
      .or(page.getByRole("button", { name: "EN" }))
      .first();
    const zhButton = page
      .getByTestId("lang-zh-CN")
      .or(page.getByRole("button", { name: "简体中文" }))
      .first();

    // Start with English
    await enButton.click();

    // Click on lane 0 to open OperatorEditor
    const laneLabel0 = page.getByTestId("axis-lane-label-0");
    await expect(laneLabel0).toBeVisible();
    const enOperatorName = await laneLabel0.textContent();
    await laneLabel0.click();

    // OperatorEditor should be open with panel-operator
    const operatorPanel = page.getByTestId("panel-operator");
    await expect(operatorPanel).toBeVisible();

    // Get operator name in EN
    const operatorHeading = operatorPanel.locator("h2").first();
    await expect(operatorHeading).toBeVisible();
    const enHeadingText = await operatorHeading.textContent();

    // Switch to zh-CN and verify operator name changes
    await zhButton.click();
    await expect(operatorHeading).not.toHaveText(enHeadingText!);
    const zhHeadingText = await operatorHeading.textContent();
    expect(zhHeadingText).not.toEqual(enHeadingText);
  });

  test("operator picker names relocalize", async ({ page }) => {
    await page.goto("/");

    const enButton = page
      .getByTestId("lang-en")
      .or(page.getByRole("button", { name: "EN" }))
      .first();
    const zhButton = page
      .getByTestId("lang-zh-CN")
      .or(page.getByRole("button", { name: "简体中文" }))
      .first();

    await enButton.click();

    const laneLabel0 = page.getByTestId("axis-lane-label-0");
    await laneLabel0.click();

    const operatorPanel = page.getByTestId("panel-operator");
    const avatarButton = operatorPanel.getByTestId("operator-change-button");
    await avatarButton.click();

    const operatorPicker = page.getByTestId("operator-picker");
    await expect(operatorPicker).toBeVisible();

    const firstOperatorItem = operatorPicker.locator("button").nth(2);
    await expect(firstOperatorItem).toBeVisible();
    const enOperatorName = await firstOperatorItem.textContent();

    await operatorPicker.getByRole("button", { name: /close|关闭/i }).click();
    await expect(operatorPicker).not.toBeVisible();

    await zhButton.click();

    // Re-query avatar button after language switch (component re-renders)
    const avatarButtonAfter = operatorPanel.getByTestId("operator-change-button");
    await avatarButtonAfter.click();
    await expect(operatorPicker).toBeVisible();

    const zhOperatorName = await firstOperatorItem.textContent();
    expect(zhOperatorName).not.toEqual(enOperatorName);

    await operatorPicker.getByRole("button", { name: /close|关闭/i }).click();
  });

  test("weapon picker names relocalize", async ({ page }) => {
    await page.goto("/");

    const enButton = page
      .getByTestId("lang-en")
      .or(page.getByRole("button", { name: "EN" }))
      .first();
    const zhButton = page
      .getByTestId("lang-zh-CN")
      .or(page.getByRole("button", { name: "简体中文" }))
      .first();

    await enButton.click();

    // Open OperatorEditor
    const laneLabel0 = page.getByTestId("axis-lane-label-0");
    await laneLabel0.click();

    // Click on Weapon tab
    const operatorPanel = page.getByTestId("panel-operator");
    const weaponTab = operatorPanel.getByRole("button", { name: /weapon|武器/i });
    await weaponTab.click();

    // Open weapon picker
    const weaponSection = operatorPanel.locator("div").filter({ hasText: /selected|selected weapon/i }).first();
    const weaponButton = weaponSection.locator("button").first();
    await expect(weaponButton).toBeVisible({ timeout: 5000 });
    await weaponButton.click();

    // Weapon picker should be visible
    const weaponPicker = page.getByTestId("weapon-picker");
    await expect(weaponPicker).toBeVisible();

    // Get first weapon name in EN
    const firstWeaponItem = weaponPicker.locator("button").nth(2);
    await expect(firstWeaponItem).toBeVisible();
    const enWeaponName = await firstWeaponItem.textContent();

    await weaponPicker.getByRole("button", { name: /close|关闭/i }).click();
    await expect(weaponPicker).not.toBeVisible();

    await zhButton.click();

    await weaponButton.click();
    await expect(weaponPicker).toBeVisible();

    const zhWeaponName = await firstWeaponItem.textContent();
    expect(zhWeaponName).not.toEqual(enWeaponName);

    await weaponPicker.getByRole("button", { name: /close|关闭/i }).click();
  });

  test("gear picker names and set headers relocalize", async ({ page }) => {
    await page.goto("/");

    const enButton = page
      .getByTestId("lang-en")
      .or(page.getByRole("button", { name: "EN" }))
      .first();
    const zhButton = page
      .getByTestId("lang-zh-CN")
      .or(page.getByRole("button", { name: "简体中文" }))
      .first();

    await enButton.click();

    // Open OperatorEditor
    const laneLabel0 = page.getByTestId("axis-lane-label-0");
    await laneLabel0.click();

    // Click on Gears tab
    const operatorPanel = page.getByTestId("panel-operator");
    const gearsTab = operatorPanel.getByRole("button", { name: /gears|装备/i });
    await gearsTab.click();

    // Open first gear picker (armor slot)
    const gearSection = operatorPanel.locator("div").filter({ hasText: /armor|盔甲/i }).first();
    const gearButton = gearSection.locator("button").first();
    await expect(gearButton).toBeVisible({ timeout: 5000 });
    await gearButton.click();

    // Gear picker should be visible
    const gearPicker = page.getByTestId("gear-picker");
    await expect(gearPicker).toBeVisible();

    // Get set header text in EN
    const setHeader = gearPicker.locator("div").filter({ hasText: /^[A-Z]/ }).first();
    let enSetHeader = "";
    if (await setHeader.isVisible().catch(() => false)) {
      enSetHeader = (await setHeader.textContent()) || "";
    }

    const firstGearItem = gearPicker.locator("button").nth(2);
    await expect(firstGearItem).toBeVisible();
    const enGearName = await firstGearItem.textContent();

    await gearPicker.getByRole("button", { name: /close|关闭/i }).click();
    await expect(gearPicker).not.toBeVisible();

    await zhButton.click();

    await gearButton.click();
    await expect(gearPicker).toBeVisible();

    const zhGearName = await firstGearItem.textContent();
    expect(zhGearName).not.toEqual(enGearName);

    if (enSetHeader) {
      const zhSetHeader = await setHeader.textContent();
      expect(zhSetHeader).not.toEqual(enSetHeader);
    }

    await gearPicker.getByRole("button", { name: /close|关闭/i }).click();
  });

  test("rest stat contributor lines relocalize", async ({ page }) => {
    await page.goto("/");

    const enButton = page
      .getByTestId("lang-en")
      .or(page.getByRole("button", { name: "EN" }))
      .first();
    const zhButton = page
      .getByTestId("lang-zh-CN")
      .or(page.getByRole("button", { name: "简体中文" }))
      .first();

    await enButton.click();

    // Open OperatorEditor
    const laneLabel0 = page.getByTestId("axis-lane-label-0");
    await laneLabel0.click();

    const operatorPanel = page.getByTestId("panel-operator");

    // Expand Rest Stat breakdown
    const restStatToggle = operatorPanel.getByTestId("rest-stat-toggle");
    await expect(restStatToggle).toBeVisible();
    await restStatToggle.click();

    // Wait for contributor log to appear
    const contributorLog = operatorPanel.locator("div").filter({ hasText: /\[level\]|\[trust\]|\[weapon\]|\[gear\]/ }).first();
    await expect(contributorLog).toBeVisible({ timeout: 5000 });

    // Get EN text
    const enLogText = await contributorLog.textContent();

    // Verify no raw keys like "restLog." appear
    expect(enLogText).not.toContain("restLog.");

    // Switch to zh-CN
    await zhButton.click();

    // Get zh-CN text
    const zhLogText = await contributorLog.textContent();

    // Verify text changed
    expect(zhLogText).not.toEqual(enLogText);

    // Verify no obvious EN tokens remain (basic check)
    expect(zhLogText).not.toContain("base ATK");
    expect(zhLogText).not.toContain("restLog.");
  });
});
