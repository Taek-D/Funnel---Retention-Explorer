import { Page, expect } from '@playwright/test';

/**
 * Set localStorage to skip the onboarding tour.
 * Must be called after page.goto() (needs a page context for localStorage access).
 */
export async function skipOnboardingTour(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('fre_onboarding_completed', 'true');
  });
}

/**
 * Navigate to /app/upload and load the ecommerce sample dataset.
 * Waits for processing to complete (Step 3/3 visible).
 */
export async function loadEcommerceSample(page: Page) {
  await page.goto('/app/upload');
  await skipOnboardingTour(page);
  // Close any existing tour dialog by reloading without tour
  await page.reload();
  await page.getByRole('button', { name: /이커머스/i }).click();
  // Wait for processing to complete — "데이터 처리 완료" heading appears
  await expect(page.getByText(/데이터 처리 완료/)).toBeVisible({ timeout: 15_000 });
}

/**
 * Navigate to /app/upload and load the SaaS sample dataset.
 */
export async function loadSaaSSample(page: Page) {
  await page.goto('/app/upload');
  await skipOnboardingTour(page);
  await page.reload();
  await page.getByRole('button', { name: /SaaS/i }).click();
  await expect(page.getByText(/데이터 처리 완료/)).toBeVisible({ timeout: 15_000 });
}

/**
 * Navigate to a page via sidebar (client-side routing, preserves React state).
 */
export async function navigateViaSidebar(page: Page, labelPattern: RegExp, expectedPath: string) {
  await page.locator('nav button').filter({ hasText: labelPattern }).click();
  await page.waitForURL(`**${expectedPath}`, { timeout: 5_000 });
}
