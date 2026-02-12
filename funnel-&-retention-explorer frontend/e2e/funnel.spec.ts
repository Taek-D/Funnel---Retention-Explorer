import { test, expect } from '@playwright/test';
import { loadEcommerceSample, navigateViaSidebar } from './helpers/sample-data';

test.describe('Funnel Analysis', () => {
  test('shows empty state when no data is loaded', async ({ page }) => {
    await page.goto('/app/funnels');
    await expect(page.getByText(/데이터 없음/)).toBeVisible();
  });

  test('shows funnel editor after loading sample data', async ({ page }) => {
    await loadEcommerceSample(page);
    await navigateViaSidebar(page, /퍼널/, '/app/funnels');
    // Template buttons visible
    await expect(page.getByRole('button', { name: /이커머스/ })).toBeVisible();
    // Calculate button visible
    await expect(page.getByRole('button', { name: /퍼널 계산/ })).toBeVisible();
  });

  test('calculates funnel and renders chart with conversion rates', async ({ page }) => {
    await loadEcommerceSample(page);
    await navigateViaSidebar(page, /퍼널/, '/app/funnels');

    // Click ecommerce template to populate steps
    await page.getByRole('button', { name: /이커머스/ }).click();

    // Click calculate
    await page.getByRole('button', { name: /퍼널 계산/ }).click();

    // Wait for Recharts chart to render
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible({ timeout: 10_000 });

    // Verify conversion rate percentage is displayed (use heading which shows overall %)
    await expect(page.getByRole('heading', { name: /%/ })).toBeVisible();
  });
});
