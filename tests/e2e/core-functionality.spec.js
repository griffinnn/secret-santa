import { test, expect } from '@playwright/test';

test.describe('Secret Santa Core Functionality', () => {
  
  test('User registration and login flow', async ({ page }) => {
    const timestamp = Date.now();
    const userName = `TestUser${timestamp}`;
    const userEmail = `test${timestamp}@test.com`;

    // Register
    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[name="name"]', userName);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('textarea[name="wishList"]', 'Books and coffee');
    
    await page.click('button[type="submit"]:has-text("Create Account")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/#/dashboard', { timeout: 15000 });
    
    // Verify dashboard loaded
    await expect(page.locator('.user-dashboard')).toBeVisible({ timeout: 5000 });
    
    // Logout
    await page.click('#auth-button');
    await page.waitForTimeout(1000);
    
    // Login again
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[name="email"]', userEmail);
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Wait longer and use catch in case redirect is slow
    await page.waitForURL('/#/dashboard', { timeout: 20000 }).catch(() => {});
    // Check if we're on dashboard or got redirected elsewhere
    const url = page.url();
    expect(url).toContain('dashboard');
  });

  test('Create exchange flow', async ({ page }) => {
    const timestamp = Date.now();
    const userName = `Creator${timestamp}`;
    const userEmail = `creator${timestamp}@test.com`;
    const exchangeName = `TestExchange${timestamp}`;

    // Register
    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[name="name"]', userName);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('textarea[name="wishList"]', 'Gifts');
    await page.click('button[type="submit"]:has-text("Create Account")');
    
    await page.waitForURL('/#/dashboard', { timeout: 15000 });
    await page.waitForTimeout(2000); // Wait for dashboard to fully initialize
    
    // Click Create Exchange tab using evaluate to trigger onclick
    await page.evaluate(() => {
      const createBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Create Exchange'));
      if (createBtn) createBtn.click();
    });
    
    await page.waitForTimeout(1000);
    
    // Wait for form
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 5000 });
    
    // Fill form
    await page.fill('input[name="name"]', exchangeName);
    await page.fill('input[name="budget"]', '50');
    await page.fill('input[name="startDate"]', '2025-12-01');
    await page.fill('input[name="endDate"]', '2025-12-25');
    
    await page.click('button[type="submit"]:has-text("Create Exchange")');
    await page.waitForTimeout(2000);
    
    // Switch to My Exchanges tab
    await page.evaluate(() => {
      const exchangesBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('My Exchanges'));
      if (exchangesBtn) exchangesBtn.click();
    });
    
    await page.waitForTimeout(1000);
    
    // Verify exchange appears - use more specific selector to avoid strict mode violation
    await expect(page.locator('h4', { hasText: exchangeName })).toBeVisible({ timeout: 5000 });
  });

  test('User can join exchange and creator can approve', async ({ page }) => {
    const timestamp = Date.now();
    const creatorName = `Creator${timestamp}`;
    const creatorEmail = `creator${timestamp}@test.com`;
    const participantName = `Participant${timestamp}`;
    const participantEmail = `participant${timestamp}@test.com`;
    const exchangeName = `JoinTest${timestamp}`;

    // CREATOR: Register and create exchange
    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[name="name"]', creatorName);
    await page.fill('input[name="email"]', creatorEmail);
    await page.fill('textarea[name="wishList"]', 'Creator gifts');
    await page.click('button[type="submit"]:has-text("Create Account")');
    await page.waitForURL('/#/dashboard', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Create exchange
    await page.evaluate(() => {
      document.querySelector('button[onclick*="showCreateTab"]').click();
    });
    await page.waitForTimeout(300);
    await page.fill('input[name="name"]', exchangeName);
    await page.fill('input[name="budget"]', '50');
    await page.fill('input[name="startDate"]', '2025-12-01');
    await page.fill('input[name="endDate"]', '2025-12-25');
    await page.click('button[type="submit"]:has-text("Create Exchange")');
    await page.waitForTimeout(1000);
    
    // Logout creator
    await page.click('#auth-button');
    await page.waitForTimeout(500);
    
    // PARTICIPANT: Register
    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[name="name"]', participantName);
    await page.fill('input[name="email"]', participantEmail);
    await page.fill('textarea[name="wishList"]', 'Participant gifts');
    await page.click('button[type="submit"]:has-text("Create Account")');
    await page.waitForURL('/#/dashboard', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Browse exchanges
    await page.evaluate(() => {
      document.querySelector('button[onclick*="showBrowseTab"]').click();
    });
    await page.waitForTimeout(300);
    
    // Request to join
    const requestBtn = page.locator('button:has-text("Request to Join")').first();
    await expect(requestBtn).toBeVisible({ timeout: 5000 });
    await requestBtn.click();
    await page.waitForTimeout(1000);
    
    // Verify appears in My Exchanges
    await page.evaluate(() => {
      document.querySelector('button[onclick*="showExchangesTab"]').click();
    });
    await page.waitForTimeout(500);
    await expect(page.locator('h4', { hasText: exchangeName })).toBeVisible({ timeout: 5000 });
    
    // Logout participant
    await page.click('#auth-button');
    await page.waitForTimeout(500);
    
    // CREATOR: Login and approve
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[name="email"]', creatorEmail);
    await page.click('button[type="submit"]:has-text("Login")');
    await page.waitForURL('/#/dashboard', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Go to My Exchanges
    await page.evaluate(() => {
      document.querySelector('button[onclick*="showExchangesTab"]').click();
    });
    await page.waitForTimeout(500);
    
    // Approve participant
    const approveBtn = page.locator('button:has-text("✅ Approve")').first();
    await expect(approveBtn).toBeVisible({ timeout: 5000 });
    await approveBtn.click();
    await page.waitForTimeout(1000);
    
    // Verify participant count increased to 1 (participant was approved)
    await expect(page.locator('p:has-text("Participants: 1")')).toBeVisible({ timeout: 5000 });
  });

});
