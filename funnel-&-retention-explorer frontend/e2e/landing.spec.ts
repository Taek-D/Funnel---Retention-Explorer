import { test, expect } from '@playwright/test';

test.describe('Landing & Navigation', () => {
  test('renders landing page with hero section', async ({ page }) => {
    await page.goto('/');
    // Hero heading visible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    // Two CTA buttons in hero
    await expect(page.getByRole('link', { name: /체험하기/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /무료 계정/ })).toBeVisible();
  });

  test('CTA "가입 없이 체험하기" navigates to /app/dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /체험하기/ }).click();
    await page.waitForURL('**/app/dashboard');
    expect(page.url()).toContain('/app/dashboard');
  });

  test('sidebar navigation routes correctly', async ({ page }) => {
    await page.goto('/app/dashboard');
    // Wait for the sidebar to be visible
    await expect(page.locator('nav')).toBeVisible();

    const routes = [
      { labelPattern: /데이터|upload/i, expectedPath: '/app/upload' },
      { labelPattern: /퍼널|funnel/i, expectedPath: '/app/funnels' },
      { labelPattern: /리텐션|retention/i, expectedPath: '/app/retention' },
      { labelPattern: /세그먼트|segment/i, expectedPath: '/app/segments' },
      { labelPattern: /인사이트|insight/i, expectedPath: '/app/insights' },
    ];

    for (const route of routes) {
      const btn = page.locator('nav button').filter({ hasText: route.labelPattern });
      await btn.click();
      await page.waitForURL(`**${route.expectedPath}`);
      expect(page.url()).toContain(route.expectedPath);
    }
  });

  test('shows 404 page for unknown route', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.getByRole('link', { name: /홈|Home/i })).toBeVisible();
  });
});
