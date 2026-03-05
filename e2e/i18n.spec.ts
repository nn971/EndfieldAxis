import { expect, test } from 'playwright/test';

test.describe('i18n locale switching smoke tests', () => {
  test('toggle language updates UI immediately', async ({ page }) => {
    await page.goto('/');

    const enButton = page
      .getByTestId('lang-en')
      .or(page.getByRole('button', { name: 'EN' }))
      .first();
    const zhButton = page
      .getByTestId('lang-zh-CN')
      .or(page.getByRole('button', { name: '简体中文' }))
      .first();
    const simHeading = page
      .getByTestId('panel-sim')
      .locator('h2')
      .or(page.getByRole('heading', { name: /Simulator|模拟器/ }))
      .first();

    await expect(enButton).toBeVisible();
    await expect(simHeading).toHaveText('Simulator');

    await zhButton.click();
    await expect(simHeading).toHaveText('模拟器');
  });

  test('language persists across reload', async ({ page }) => {
    await page.goto('/');

    const enButton = page
      .getByTestId('lang-en')
      .or(page.getByRole('button', { name: 'EN' }))
      .first();
    const zhButton = page
      .getByTestId('lang-zh-CN')
      .or(page.getByRole('button', { name: '简体中文' }))
      .first();
    const simHeading = page
      .getByTestId('panel-sim')
      .locator('h2')
      .or(page.getByRole('heading', { name: /Simulator|模拟器/ }))
      .first();

    await expect(enButton).toBeVisible();
    await zhButton.click();
    await expect(simHeading).toHaveText('模拟器');
    await expect(zhButton).toHaveClass(/bg-zinc-600/);

    await page.reload();

    await expect(simHeading).toHaveText('模拟器');
    await expect(zhButton).toHaveClass(/bg-zinc-600/);
  });
});
