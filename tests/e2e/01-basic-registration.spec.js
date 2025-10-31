import { test, expect } from '@playwright/test';

test.describe('Basic Registration Flow', () => {
  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/#/register');
    
    // Wait for form to load
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 5000 });

    // Fill form with valid data
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="wishList"]', 'Books and coffee');

    // Submit
    await page.click('button[type="submit"]:has-text("Create Account")');

    // Verify success or dashboard redirect
    // Wait for either success message or dashboard
    try {
      await expect(page.locator('text=successfully')).toBeVisible({ timeout: 5000 });
    } catch {
      // If no success message, check if we're on dashboard
      await expect(page.locator('button:has-text("➕ Create Exchange")')).toBeVisible({ timeout: 5000 });
    }
  });
});
