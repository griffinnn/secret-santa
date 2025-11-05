import { test, expect } from '@playwright/test';
import {
  waitForDashboardReady,
  waitForLoadingToFinish,
  waitForRoute,
  clickDashboardTab,
  performLogout,
  dismissMessageIfVisible,
} from './helpers.js';

test.describe('Secret Santa Core Functionality', () => {
  
  test('User registration and login flow', async ({ page }) => {
    const timestamp = Date.now();
    const userName = `TestUser${timestamp}`;
    const userEmail = `test${timestamp}@test.com`;

    // Register new account
    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);

    await page.fill('input[name="name"]', userName);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('textarea[name="wishList"]', 'Books and coffee');

    const registrationResponse = page.waitForResponse((response) =>
      response.url().includes('/api/users') && response.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    await registrationResponse;
    await waitForLoadingToFinish(page);
    await dismissMessageIfVisible(page);

    // First login
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    await page.fill('input[name="email"]', userEmail);

    const firstLoginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    await page.click('button[type="submit"]:has-text("Login")');
    await firstLoginResponse;
    await waitForRoute(page, '#/dashboard');
    await waitForDashboardReady(page);

    // Logout
    await performLogout(page);

    // Login again to verify returning users
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    await page.fill('input[name="email"]', userEmail);

    const secondLoginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    await page.click('button[type="submit"]:has-text("Login")');
    await secondLoginResponse;
    await waitForRoute(page, '#/dashboard');
    await waitForDashboardReady(page);
  });

  test('Create exchange flow', async ({ page }) => {
    const timestamp = Date.now();
    const userName = `Creator${timestamp}`;
    const userEmail = `creator${timestamp}@test.com`;
    const exchangeName = `TestExchange${timestamp}`;

    // Register
    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    
    await page.fill('input[name="name"]', userName);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('textarea[name="wishList"]', 'Gifts');

    const registrationResponse = page.waitForResponse((response) =>
      response.url().includes('/api/users') && response.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    await registrationResponse;
    await waitForLoadingToFinish(page);
    await dismissMessageIfVisible(page);

    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    await page.fill('input[name="email"]', userEmail);

    const loginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    await page.click('button[type="submit"]:has-text("Login")');
    await loginResponse;
    await waitForRoute(page, '#/dashboard');
    await waitForDashboardReady(page);
    
    // Click Create Exchange tab using evaluate to trigger onclick
    await clickDashboardTab(page, 'showCreateTab');

    // Wait for form
    await expect(page.locator('#create-exchange-form')).toBeVisible({ timeout: 5000 });
    
    // Fill form
    await page.fill('input[name="name"]', exchangeName);
    await page.fill('input[name="budget"]', '50');
    await page.fill('input[name="startDate"]', '2025-12-01');
    await page.fill('input[name="endDate"]', '2025-12-25');

    const createExchangeResponse = page.waitForResponse((response) =>
      response.url().includes('/api/exchanges') && response.request().method() === 'POST'
    );
    await page.click('button[type="submit"]:has-text("Create Exchange")');
    await createExchangeResponse;
    await waitForLoadingToFinish(page);
    await dismissMessageIfVisible(page);
    
    // Switch to My Exchanges tab
    const exchangesRefresh = page.waitForResponse((response) =>
      response.url().includes('/api/exchanges/user/') && response.request().method() === 'GET'
    );
    await clickDashboardTab(page, 'showExchangesTab');
    await exchangesRefresh;

    // Verify exchange appears - use more specific selector to avoid strict mode violation
    await expect(page.locator('h4', { hasText: exchangeName })).toBeVisible({ timeout: 10000 });
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
    await waitForLoadingToFinish(page);
    await page.fill('input[name="name"]', creatorName);
    await page.fill('input[name="email"]', creatorEmail);
    await page.fill('textarea[name="wishList"]', 'Creator gifts');

    const creatorRegistrationResponse = page.waitForResponse((response) =>
      response.url().includes('/api/users') && response.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    await creatorRegistrationResponse;
    await waitForLoadingToFinish(page);
    await dismissMessageIfVisible(page);

    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    await page.fill('input[name="email"]', creatorEmail);

    const creatorLoginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    await page.click('button[type="submit"]:has-text("Login")');
    await creatorLoginResponse;
    await waitForRoute(page, '#/dashboard');
    await waitForDashboardReady(page);
    
    // Create exchange
    await clickDashboardTab(page, 'showCreateTab');
    await page.fill('input[name="name"]', exchangeName);
    await page.fill('input[name="budget"]', '50');
    await page.fill('input[name="startDate"]', '2025-12-01');
    await page.fill('input[name="endDate"]', '2025-12-25');
    const creatorExchangeResponse = page.waitForResponse((response) =>
      response.url().includes('/api/exchanges') && response.request().method() === 'POST'
    );
    await page.click('button[type="submit"]:has-text("Create Exchange")');
    await creatorExchangeResponse;
    await waitForLoadingToFinish(page);
    await dismissMessageIfVisible(page);
    
    // Logout creator
    await performLogout(page);
    
    // PARTICIPANT: Register
    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    await page.fill('input[name="name"]', participantName);
    await page.fill('input[name="email"]', participantEmail);
    await page.fill('textarea[name="wishList"]', 'Participant gifts');

    const participantRegistrationResponse = page.waitForResponse((response) =>
      response.url().includes('/api/users') && response.request().method() === 'POST'
    );
    await page.click('button[type="submit"]:has-text("Create Account")');
    await participantRegistrationResponse;
    await waitForLoadingToFinish(page);
    await dismissMessageIfVisible(page);

    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    await page.fill('input[name="email"]', participantEmail);

    const participantLoginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    await page.click('button[type="submit"]:has-text("Login")');
    await participantLoginResponse;
    await waitForRoute(page, '#/dashboard');
    await waitForDashboardReady(page);
    
    // Browse exchanges
    await clickDashboardTab(page, 'showBrowseTab');
    await expect(page.locator('.exchange-browse-card')).first().toBeVisible({ timeout: 5000 });
    
    // Request to join specific exchange card
    const exchangeCard = page.locator('.exchange-browse-card', { hasText: exchangeName });
    await expect(exchangeCard).toBeVisible({ timeout: 5000 });
    const joinRequestResponse = page.waitForResponse((response) =>
      response.url().includes('/api/exchanges') && response.url().includes('/request-join') && response.request().method() === 'POST'
    );
    await exchangeCard.locator('button:has-text("Request to Join")').click();
    await joinRequestResponse;
    await waitForLoadingToFinish(page);
    await dismissMessageIfVisible(page);
    
    // Verify appears in My Exchanges
    const userExchangesResponse = page.waitForResponse((response) =>
      response.url().includes('/api/exchanges/user/') && response.request().method() === 'GET'
    );
    await clickDashboardTab(page, 'showExchangesTab');
    await userExchangesResponse;
    await page.waitForFunction((name) => {
      return Array.from(document.querySelectorAll('h4')).some((el) => el.textContent?.includes(name));
    }, exchangeName, { timeout: 10000 });
    await expect(page.locator('h4', { hasText: exchangeName })).toBeVisible({ timeout: 10000 });
    
    // Logout participant
    await performLogout(page);
    
    // CREATOR: Login and approve
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    await page.fill('input[name="email"]', creatorEmail);

    const creatorReturnLoginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    await page.click('button[type="submit"]:has-text("Login")');
    await creatorReturnLoginResponse;
    await waitForRoute(page, '#/dashboard');
    await waitForDashboardReady(page);
    
    // Go to My Exchanges
    await clickDashboardTab(page, 'showExchangesTab');
    
    // Approve participant
    const approveBtn = page.locator('button:has-text("✅ Approve")').first();
    await expect(approveBtn).toBeVisible({ timeout: 5000 });
    const approveResponse = page.waitForResponse((response) =>
      response.url().includes('/api/exchanges') && response.url().includes('/approve-participant') && response.request().method() === 'POST'
    );
    await approveBtn.click();
    await approveResponse;
    await waitForLoadingToFinish(page);
    await dismissMessageIfVisible(page);
    
    // Verify participant count increased to 1 (participant was approved)
    await expect(page.locator('p:has-text("Participants: 1")')).toBeVisible({ timeout: 5000 });
  });

});
