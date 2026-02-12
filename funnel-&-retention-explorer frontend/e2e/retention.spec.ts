import { test, expect } from '@playwright/test';
import { loadEcommerceSample, navigateViaSidebar } from './helpers/sample-data';

test.describe('Retention Analysis', () => {
  test('shows empty state when no data is loaded', async ({ page }) => {
    await page.goto('/app/retention');
    await expect(page.getByText(/데이터 없음/)).toBeVisible();
  });

  test('shows retention controls after loading sample data', async ({ page }) => {
    await loadEcommerceSample(page);
    await navigateViaSidebar(page, /리텐션/, '/app/retention');
    // Cohort event select visible
    await expect(page.locator('select').first()).toBeVisible();
    // Calculate button visible
    await expect(page.getByRole('button', { name: /리텐션 계산/ })).toBeVisible();
  });

  test('calculates retention and renders results', async ({ page }) => {
    await loadEcommerceSample(page);
    await navigateViaSidebar(page, /리텐션/, '/app/retention');

    // Select cohort event by value
    const cohortSelect = page.locator('select').first();
    await cohortSelect.selectOption('page_view');

    // Select active events (click event buttons in the multi-select area)
    const activeEventsArea = page.locator('text=활성 이벤트').locator('..').locator('..');
    await activeEventsArea.getByRole('button', { name: 'page_view' }).click();

    // Click calculate
    await page.getByRole('button', { name: /리텐션 계산/ }).click();

    // Wait for retention results — check for "Day 0" in the retention curve
    await expect(page.getByText(/Day 0/)).toBeVisible({ timeout: 10_000 });

    // Verify retention curve chart rendered
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible();
  });
});
