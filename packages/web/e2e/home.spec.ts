import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the home page', async ({ page }) => {
    await expect(page).toHaveTitle(/ShardDen/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display tool cards', async ({ page }) => {
    const toolCards = page.locator('[class*="card"], [class*="ToolCard"]');
    await expect(toolCards.first()).toBeVisible();
  });

  test('should navigate to JSON Extractor tool', async ({ page }) => {
    const jsonExtractorLink = page.getByRole('link', { name: /json/i }).first();
    await jsonExtractorLink.click();
    await expect(page).toHaveURL(/.*tools\/json-extractor/);
  });

  test('should navigate to UML Styler tool', async ({ page }) => {
    const umlStylerLink = page.getByRole('link', { name: /uml/i }).first();
    await umlStylerLink.click();
    await expect(page).toHaveURL(/.*tools\/uml-styler/);
  });
});

test.describe('Navigation', () => {
  test('should have working navigation between tools', async ({ page }) => {
    await page.goto('/');
    
    // Go to JSON Extractor
    await page.getByRole('link', { name: /json/i }).first().click();
    await expect(page).toHaveURL(/.*tools\/json-extractor/);
    
    // Go back home
    await page.getByRole('link', { name: /home/i }).click();
    await expect(page).toHaveURL('/');
    
    // Go to UML Styler
    await page.getByRole('link', { name: /uml/i }).first().click();
    await expect(page).toHaveURL(/.*tools\/uml-styler/);
  });
});

test.describe('Theme', () => {
  test('should toggle theme', async ({ page }) => {
    await page.goto('/');
    
    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|模式/i }).first();
    
    if (await themeToggle.isVisible()) {
      const initialHtmlClass = await page.locator('html').getAttribute('class');
      await themeToggle.click();
      const newHtmlClass = await page.locator('html').getAttribute('class');
      expect(newHtmlClass).not.toBe(initialHtmlClass);
    }
  });
});
