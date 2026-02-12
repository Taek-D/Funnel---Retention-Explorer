import { test, expect } from '@playwright/test';
import { loadEcommerceSample, loadSaaSSample, navigateViaSidebar } from './helpers/sample-data';

test.describe('Data Upload & Sample Data', () => {
  test('renders upload page with file drop zone and sample buttons', async ({ page }) => {
    await page.goto('/app/upload');
    // File upload area
    await expect(page.locator('[data-tour="upload"]')).toBeVisible();
    // Sample data buttons
    await expect(page.getByRole('button', { name: /이커머스/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /SaaS/i })).toBeVisible();
  });

  test('loads ecommerce sample and shows dashboard with KPIs', async ({ page }) => {
    await loadEcommerceSample(page);
    // Navigate to dashboard via sidebar (preserves React state)
    await navigateViaSidebar(page, /대시보드/, '/app/dashboard');
    // Dashboard should show KPI values (large text numbers)
    const kpiElements = page.locator('.text-3xl');
    await expect(kpiElements.first()).toBeVisible({ timeout: 5_000 });
    const firstKpiText = await kpiElements.first().textContent();
    expect(firstKpiText).toBeTruthy();
  });

  test('loads SaaS sample and shows dashboard with KPIs', async ({ page }) => {
    await loadSaaSSample(page);
    await navigateViaSidebar(page, /대시보드/, '/app/dashboard');
    const kpiElements = page.locator('.text-3xl');
    await expect(kpiElements.first()).toBeVisible({ timeout: 5_000 });
    const firstKpiText = await kpiElements.first().textContent();
    expect(firstKpiText).toBeTruthy();
  });
});
