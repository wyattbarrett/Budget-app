import { test, expect } from '@playwright/test';

test.describe('New User Flow', () => {
    test('Complete dashboard setup and snowball verification', async ({ page }) => {
        // 1. Dashboard Access (Bypass Login)
        await page.goto('/');

        // Wait for Loading screen to disappear (increase timeout for stability)
        await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 15000 });

        // Navigate to Budget Page for Setup
        await page.goto('/budget');

        // Verify Zero-Based Calculator initial state
        await expect(page.getByText('Est. Income')).toBeVisible();
        await expect(page.getByText('Remaining')).toBeVisible();

        // 2. Add Bill (Rent)
        await page.getByRole('button', { name: 'Add Bill' }).click();
        await expect(page.getByText('Add Monthly Bill')).toBeVisible();

        await page.getByPlaceholder('e.g. Rent').fill('Rent');
        await page.getByPlaceholder('0.00').fill('1500');
        await page.getByPlaceholder('DD').fill('1');
        await page.getByRole('button', { name: 'Add Bill', exact: true }).click();

        // Verify Bill appears
        await expect(page.getByText('Rent', { exact: true })).toBeVisible();
        await expect(page.getByText('$1,500.00')).toBeVisible(); // Formatted

        // 3. Add Sinking Fund (Vacation)
        await page.getByRole('button', { name: 'Add Account' }).click();

        await expect(page.getByText('Add Sinking Fund').or(page.getByText('Add Account'))).toBeVisible();

        // Using generic selectors as fallback if labels are tricky
        await page.locator('input[type="text"]').last().fill('Vacation');
        await page.locator('input[type="number"]').first().fill('2000');

        await page.getByRole('button', { name: 'Add Fund' }).click();

        // Verify Fund appears
        await expect(page.getByText('Vacation')).toBeVisible();
        await expect(page.getByText('$2,000.00')).toBeVisible();

        // 4. Verify Calculations
        await expect(page.locator('body')).toContainText('3,500');
        await expect(page.locator('body')).toContainText('1,500');

        // 5. Snowball Flow
        await page.goto('/snowball');
        // Wait for loading again just in case? Usually client-side routing is instant.
        await expect(page.getByText('Debt Snowball')).toBeVisible();

        await page.getByRole('button', { name: 'add' }).click();
        await expect(page.getByText('Add Liability')).toBeVisible();

        await page.getByPlaceholder('Debt Name (e.g. Visa)').fill('Visa');
        await page.getByPlaceholder('Current Balance').fill('5000');
        await page.getByPlaceholder('Min Monthly Payment').fill('150');
        await page.getByPlaceholder('APR %').fill('20');

        await page.getByRole('button', { name: 'Add Debt' }).click();

        // Verify Debt
        await expect(page.getByText('Visa')).toBeVisible();
        await expect(page.getByText('$150 min')).toBeVisible();

        // Verify Payoff Priority List
        await expect(page.getByText('Payoff Priority')).toBeVisible();
        await expect(page.getByText('NEXT TARGET')).toBeVisible();
    });
});
