import { test, expect } from '@playwright/test';

test.describe('JSON Extractor Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/json-extractor');
  });

  test('should load the JSON Extractor page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/JSON/i);
  });

  test('should have input textarea', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
  });

  test('should have path input field', async ({ page }) => {
    const pathInput = page.locator('input[type="text"]').first();
    await expect(pathInput).toBeVisible();
  });

  test('should extract data from valid JSON', async ({ page }) => {
    // Enter valid JSON
    const textarea = page.locator('textarea').first();
    await textarea.fill('{"name": "test", "value": 123}');

    // Enter path
    const pathInput = page.locator('input[type="text"]').first();
    await pathInput.fill('name');

    // Click extract button
    const extractButton = page.getByRole('button', { name: /extract|提取/i });
    await extractButton.click();

    // Check result
    const result = page.locator('[class*="result"], pre, code').first();
    await expect(result).toBeVisible();
  });

  test('should handle invalid JSON gracefully', async ({ page }) => {
    // Enter invalid JSON
    const textarea = page.locator('textarea').first();
    await textarea.fill('not valid json');

    // Click extract button
    const extractButton = page.getByRole('button', { name: /extract|提取/i });
    await extractButton.click();

    // Should show error message
    const errorMessage = page.locator('[class*="error"], [role="alert"]').first();
    await expect(errorMessage).toBeVisible();
  });
});
