import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://127.0.0.1:3000';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

test.describe('PHASE 1: Authentication, Routing Security & Session Persistence', () => {

  const testKitchenEmail = `playwright_test_kitchen_${Date.now()}@pizzamasterg.com`;
  const testKitchenPassword = 'playwrightpassword123';
  let testUserId: string;

  test.beforeAll(async () => {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testKitchenEmail,
      password: testKitchenPassword,
      email_confirm: true,
      user_metadata: { role: 'kitchen' }
    });
    if (error) throw error;
    if (data.user) testUserId = data.user.id;
  });

  test.afterAll(async () => {
    // Clean up
    if (testUserId) {
      await supabaseAdmin.auth.admin.deleteUser(testUserId);
    }
  });

  test('1. Sign in with Google functionality', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Bypass Location Modal by setting sessionStorage
    await page.evaluate(() => {
      sessionStorage.setItem('pmg_location', 'Azizabad (Mukka Chowk), Karachi ~ eta 30 minutes.');
    });
    await page.reload();

    // Locate and open the Auth overlay
    await page.click('button:has-text("Sign In / Register")');
    
    // Verify the Auth overlay appears with the Google button
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
  });

  test('2a. Restricted Dashboard - Unauthenticated User is blocked', async ({ page }) => {
    await page.goto(`${BASE_URL}/kitchen-dashboard`);
    
    // Should be instantly redirected away from the protected page
    await page.waitForURL('**/kitchen-login');
    await expect(page).toHaveURL(/.*kitchen-login/);
  });

  test('2b. Restricted Dashboard - Authenticated Customer is blocked', async ({ page }) => {
    const testCustomerEmail = `playwright_test_customer_${Date.now()}@pizzamasterg.com`;
    const { data } = await supabaseAdmin.auth.admin.createUser({
      email: testCustomerEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: { role: 'customer' }
    });
    
    // Login via UI
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testCustomerEmail);
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for redirect to /kitchen-dashboard
    // Since it's a customer, kitchen-dashboard page will see role=customer and redirect to '/'
    await page.waitForURL(BASE_URL + '/');
    await expect(page).toHaveURL(BASE_URL + '/');

    // Cleanup
    if (data.user) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    }
  });

  test('2c. Restricted Dashboard - Admin/Kitchen is allowed', async ({ page }) => {
    // Login as Kitchen User
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testKitchenEmail);
    await page.fill('input[type="password"]', testKitchenPassword);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/.*kitchen-dashboard/);
    await expect(page).toHaveURL(/.*kitchen-dashboard/);

    // Assert we stay on the page and it renders correctly
    await expect(page.locator('text=PENDING')).toBeVisible();
  });

  test('3. The Refresh Bug - Session Persistence on Refresh', async ({ page }) => {
    // Login as Kitchen User
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testKitchenEmail);
    await page.fill('input[type="password"]', testKitchenPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*kitchen-dashboard/);
    await expect(page.locator('text=PENDING')).toBeVisible();

    // EXECUTE HARD BROWSER REFRESH
    await page.reload({ waitUntil: 'networkidle' });

    // Assert session is maintained
    await expect(page).toHaveURL(/.*kitchen-dashboard/);
    await expect(page.locator('text=PENDING')).toBeVisible();
    
    // Additionally, verify navigating to the main site retains the auth state (no "Sign In" button)
    await page.goto(BASE_URL);
    await expect(page.locator('button:has-text("Sign In / Register")')).toBeHidden();
  });

});
