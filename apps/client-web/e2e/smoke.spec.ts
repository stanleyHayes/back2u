import { expect, test } from '@playwright/test';

test.describe('client-web smoke', () => {
  test('home renders the brand and feed CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Back2u/i);
    await expect(page.getByRole('heading', { name: /Lost.*found/i })).toBeVisible();
  });

  test('register page is reachable', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('login redirects guests posting an item', async ({ page }) => {
    await page.goto('/post');
    await expect(page).toHaveURL(/\/login/);
  });

  test('marketplace page renders without crashing', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page.getByRole('heading', { name: /unclaimed marketplace/i })).toBeVisible();
  });
});
