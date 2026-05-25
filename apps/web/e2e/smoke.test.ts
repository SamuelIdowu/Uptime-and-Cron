import { test, expect } from '@playwright/test';

test('should load the sign-in page', async ({ page }) => {
  await page.goto('/sign-in');
  // Check if sign-in text exists (Clerk usually has this)
  await expect(page.getByText(/sign in/i).first()).toBeVisible();
});

test('should have metadata title', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page).toHaveTitle(/SteadyState/i);
});
