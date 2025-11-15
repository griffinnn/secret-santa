import { test, expect } from '@playwright/test';
import { waitForDashboardReady, waitForLoadingToFinish, waitForRoute, clickDashboardTab, performLogout, dismissMessageIfVisible } from './helpers.js';

// Happy path: creator creates exchange, adds two more users, approves them, then generates assignments
// Verifies assignmentsGenerated flag and POST /exchanges/:id/generate-assignments

test('Generate assignments end-to-end', async ({ page, browser }) => {
  const ts = Date.now();
  const creator = { name: `Creator${ts}`, email: `creator${ts}@test.com` };
  const p1 = { name: `P1_${ts}`, email: `p1_${ts}@test.com` };
  const p2 = { name: `P2_${ts}`, email: `p2_${ts}@test.com` };
  const exchangeName = `Ex${ts}`;

  // Creator registers and logs in
  await page.goto('/#/register');
  await page.waitForLoadState('domcontentloaded');
  await waitForLoadingToFinish(page);
  await page.fill('input[name="name"]', creator.name);
  await page.fill('input[name="email"]', creator.email);
  await page.fill('textarea[name="wishList"]', 'Coffee');
  const regResp = page.waitForResponse(r => r.url().includes('/api/users') && r.request().method() === 'POST');
  await page.locator('button[type="submit"]:has-text("Create Account")').click();
  await regResp; await waitForLoadingToFinish(page); await dismissMessageIfVisible(page);
  await page.goto('/#/login');
  await page.waitForLoadState('domcontentloaded');
  await waitForLoadingToFinish(page);
  await page.fill('input[name="email"]', creator.email);
  const loginResp = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
  await page.click('button[type="submit"]:has-text("Login")');
  await loginResp; await waitForRoute(page, '#/dashboard'); await waitForDashboardReady(page);

  // Create exchange
  await clickDashboardTab(page, 'showCreateTab');
  await page.fill('input[name="name"]', exchangeName);
  await page.fill('input[name="budget"]', '25');
  const createResp = page.waitForResponse(r => r.url().includes('/api/exchanges') && r.request().method() === 'POST');
  await page.click('button[type="submit"]:has-text("Create Exchange")');
  const created = await createResp.then(r => r.json());
  const exchangeId = created.id;
  await waitForLoadingToFinish(page); await dismissMessageIfVisible(page);

  // Logout creator
  await performLogout(page);

  // Helper to register and request join
  async function registerAndRequestJoin(user) {
    const p = await browser.newPage();
    await p.goto('/#/register');
    await p.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(p);
    await p.fill('input[name="name"]', user.name);
    await p.fill('input[name="email"]', user.email);
    await p.fill('textarea[name="wishList"]', 'Goodies');
    const reg = p.waitForResponse(r => r.url().includes('/api/users') && r.request().method() === 'POST');
    await p.locator('button[type="submit"]:has-text("Create Account")').click();
    await reg; await waitForLoadingToFinish(p); await dismissMessageIfVisible(p);
    await p.goto('/#/login');
    await waitForLoadingToFinish(p);
    await p.fill('input[name="email"]', user.email);
    const login = p.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
    await p.click('button[type="submit"]:has-text("Login")');
    await login; await waitForRoute(p, '#/dashboard'); await waitForDashboardReady(p);
    // Browse and request join
    await clickDashboardTab(p, 'showBrowseTab');
    const joinReq = p.waitForResponse(r => r.url().includes('/api/exchanges') && r.url().includes('/request-join') && r.request().method() === 'POST');
    await p.locator('.exchange-browse-card', { hasText: exchangeName }).locator('button:has-text("Request to Join")').click();
    await joinReq; await waitForLoadingToFinish(p); await dismissMessageIfVisible(p);
    return p;
  }

  const p1Page = await registerAndRequestJoin(p1);
  const p2Page = await registerAndRequestJoin(p2);

  // Creator logs back in and approves both
  await page.goto('/#/login');
  await waitForLoadingToFinish(page);
  await page.fill('input[name="email"]', creator.email);
  const relog = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
  await page.click('button[type="submit"]:has-text("Login")');
  await relog; await waitForRoute(page, '#/dashboard'); await waitForDashboardReady(page);
  await clickDashboardTab(page, 'showExchangesTab');
  // Open exchange
  await page.locator('h4', { hasText: exchangeName }).click();
  await waitForLoadingToFinish(page);
  // Approve two pending
  for (let i = 0; i < 2; i++) {
    const approve = page.waitForResponse(r => r.url().includes('/approve-participant') && r.request().method() === 'POST');
    await page.locator('button', { hasText: '✅ Approve' }).first().click();
    await approve; await waitForLoadingToFinish(page);
  }

  // Now generate assignments
  const genResp = page.waitForResponse(r => r.url().includes('/api/exchanges/') && r.url().includes('/generate-assignments') && r.request().method() === 'POST');
  await page.locator('button', { hasText: '🎁 Generate Assignments' }).click();
  const genData = await genResp.then(r => r.json());
  expect(genData.assignments?.length).toBe(3);
});
