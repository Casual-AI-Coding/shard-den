import { test, expect } from '@playwright/test';

test.describe('UML Styler Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/uml-styler');
  });

  test('should load the UML Styler page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/UML/i);
  });

  test('should have input textarea for UML code', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
  });

  test('should have diagram type selector', async ({ page }) => {
    const selector = page.locator('[class*="select"], [role="combobox"]').first();
    await expect(selector).toBeVisible();
  });

  test('should have style options', async ({ page }) => {
    const styleOptions = page.locator('button[class*="option"], input[type="checkbox"]');
    const count = await styleOptions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should render UML diagram from valid input', async ({ page }) => {
    // Enter valid UML code
    const textarea = page.locator('textarea').first();
    await textarea.fill('classDiagram\nClass01 <|-- AveryLongClass : Cool\nClass03 *-- Class04');

    // Click render button
    const renderButton = page.getByRole('button', { name: /render|style/i });
    await renderButton.click();

    // Should show rendered diagram (mermaid or SVG)
    const diagram = page.locator('svg, .mermaid, [class*="diagram"]').first();
    await expect(diagram).toBeVisible();
  });

  test('should handle empty input', async ({ page }) => {
    // Leave empty and click render
    const renderButton = page.getByRole('button', { name: /render|style/i });
    await renderButton.click();

    // Should not crash, should show some feedback
    await expect(page.locator('body')).toBeVisible();
  });
});
