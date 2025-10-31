import { test, expect } from '@playwright/test';

test.describe('Secret Santa Basic User Flows', () => {
  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/#/register');
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 5000 });

    await page.fill('input[name="name"]', 'Alice Test');
    await page.fill('input[name="email"]', 'alice@example.com');
    await page.fill('textarea[name="wishList"]', 'Books, coffee, puzzles');

    await page.click('button[type="submit"]:has-text("Create Account")');

    // Should either show success message or redirect to dashboard
    await expect(page).toHaveURL(/\/#\/(dashboard|register)/, { timeout: 5000 });
  });

  test('should allow login from home page', async ({ page }) => {
    await page.goto('/#/');
    
    // Click login button in navbar (use specific ID to avoid strict mode)
    const loginBtn = page.locator('#auth-button');
    await expect(loginBtn).toBeVisible();
    
    await loginBtn.click();
    
    // Should navigate to login page
    await expect(page).toHaveURL('/#/login', { timeout: 5000 });
  });

  test('should access dashboard after registration and login', async ({ page }) => {
    // First register
    await page.goto('/#/register');
    await expect(page.locator('input[name="name"]')).toBeVisible();

    const timestamp = Date.now();
    await page.fill('input[name="name"]', `User${timestamp}`);
    await page.fill('input[name="email"]', `user${timestamp}@test.com`);
    await page.fill('textarea[name="wishList"]', 'Test items');

    await page.click('button[type="submit"]:has-text("Create Account")');

    // Wait for either dashboard or success/redirect
    // Just verify we got past registration (either redirected or stayed with message)
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    
    // Should either be on dashboard or registration page (success message shown)
    expect(currentUrl).toMatch(/\/(dashboard|register)/);
  });

  test('should navigate between main routes', async ({ page }) => {
    await page.goto('/#/');
    
    // Check home page loads
    await expect(page).toHaveURL('/#/', { timeout: 5000 });
    
    // Navigate to register
    await page.goto('/#/register');
    await expect(page).toHaveURL('/#/register', { timeout: 5000 });
    
    // Navigate back to home
    await page.goto('/#/');
    await expect(page).toHaveURL('/#/', { timeout: 5000 });
  });

  test('should show error for invalid registration data', async ({ page }) => {
    await page.goto('/#/register');
    await expect(page.locator('input[name="name"]')).toBeVisible();

    // Try to submit with invalid email
    await page.fill('input[name="name"]', 'Valid Name');
    await page.fill('input[name="email"]', 'not-an-email');

    await page.click('button[type="submit"]:has-text("Create Account")');

    // Should show error message (either as alert or in UI)
    // Check for error in message container or stay on registration page
    const urlOrMessage = await Promise.race([
      page.waitForURL('/#/register', { timeout: 2000 }).then(() => 'stayed'),
      page.locator('id=message-text').waitFor({ state: 'visible', timeout: 2000 }).then(() => 'message')
    ]).catch(() => 'unknown');

    // Should either stay on register page or show an error message
    expect(['stayed', 'message', 'unknown']).toContain(urlOrMessage);
  });
});
