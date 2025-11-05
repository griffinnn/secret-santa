import { expect } from '@playwright/test';

const HASH_HOME = '#/';

export const createUniqueId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

export const waitForMessageToHide = async (page) => {
  await page.waitForFunction(() => {
    const container = document.getElementById('message-container');
    if (!container) return true;
    if (container.classList.contains('hidden')) return true;
    const style = window.getComputedStyle(container);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
  }, null, { timeout: 8000 });
};

export const dismissMessageIfVisible = async (page) => {
  const container = page.locator('#message-container');
  if (await container.isVisible()) {
    await page.evaluate(() => {
      if (window.secretSantaApp?.hideMessage) {
        window.secretSantaApp.hideMessage();
      } else {
        const closeBtn = document.getElementById('message-close');
        if (closeBtn) closeBtn.click();
      }
    });
  }
  await waitForMessageToHide(page);
};

export const waitForLoadingToFinish = async (page) => {
  await page.waitForFunction(() => {
    const loader = document.getElementById('loading-container');
    if (!loader) return true;
    if (loader.classList.contains('hidden')) return true;
    const style = window.getComputedStyle(loader);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
  }, null, { timeout: 8000 });
};

export const waitForRoute = async (page, hashes) => {
  const expected = Array.isArray(hashes) ? hashes : [hashes];
  await page.waitForFunction((allowed) => allowed.includes(window.location.hash), expected, { timeout: 8000 });
};

export const waitForDashboardReady = async (page) => {
  await waitForLoadingToFinish(page);
  await expect(page.locator('.user-dashboard')).toBeVisible({ timeout: 8000 });
  await dismissMessageIfVisible(page);
};

export const clickDashboardTab = async (page, handlerName) => {
  await dismissMessageIfVisible(page);
  await waitForLoadingToFinish(page);
  const tabButton = page.locator(`button[onclick*="${handlerName}"]`).first();
  await tabButton.waitFor({ state: 'visible' });
  await tabButton.click();
  await waitForLoadingToFinish(page);
};

export const performLogout = async (page) => {
  await dismissMessageIfVisible(page);
  await waitForLoadingToFinish(page);
  const logoutResponse = page.waitForResponse((response) =>
    response.url().includes('/api/auth/logout') && response.request().method() === 'POST'
  );
  await page.locator('#auth-button').click();
  await logoutResponse;
  await waitForRoute(page, [HASH_HOME, '#', '']);
  await dismissMessageIfVisible(page);
};
