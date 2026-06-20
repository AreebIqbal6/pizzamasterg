import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

test.describe('PHASE 2: The Kitchen Order System & Real-Time Tracking', () => {
  test.describe.configure({ mode: 'serial' });

  // Database credentials for raw queries
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const testAdminEmail = `playwright_admin_${Date.now()}@pizzamasterg.com`;
  const testAdminPassword = 'playwrightpassword123';
  let testUserId: string;

  test.beforeAll(async () => {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testAdminEmail,
      password: testAdminPassword,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });
    if (error) throw error;
    if (data.user) testUserId = data.user.id;
  });

  test.afterAll(async () => {
    // Clean up user
    if (testUserId) {
      await supabaseAdmin.auth.admin.deleteUser(testUserId);
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pmg_cookies_accepted', 'true');
      sessionStorage.setItem('pmg_location', 'Mukka Chowk');
    });

    // Login as Admin User before each test
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testAdminEmail);
    await page.fill('input[type="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to kitchen-dashboard
    await page.waitForURL(/.*kitchen-dashboard/);
  });

  test('1. Real-Time Sync: New order appears without page reload', async ({ page }) => {
    // Wait for the Kitchen Dashboard to be fully loaded
    await expect(page.locator('text=Live Orders')).toBeVisible();

    const mockOrderName = `TestCustomer-${Date.now()}`;

    // Mock incoming order directly to the database via Supabase Admin
    const { data, error } = await supabaseAdmin.from('orders').insert({
      customer_name: mockOrderName,
      customer_address: '123 Test Street, Karachi',
      items: [{ name: 'Test Pizza', quantity: 1, price: 1000 }],
      total: 1000,
      status: 'pending',
    }).select().single();

    expect(error).toBeNull();

    // Verify the UI updates to display the new order automatically WITHOUT a page reload
    // We wait up to 10 seconds for the real-time subscription to trigger and update the DOM
    await expect(page.locator(`text=${mockOrderName}`)).toBeVisible({ timeout: 10000 });
    
    // Clean up the order
    if (data) {
      await supabaseAdmin.from('orders').delete().eq('id', data.id);
    }
  });

  test('2. UI Micro-interactions: "View All" button expands data state', async ({ page }) => {
    // Navigate to Admin Dashboard (where the "View All" button is located)
    await page.goto(`${BASE_URL}/admin-dashboard`);
    await expect(page.locator('text=Dashboard Overview')).toBeVisible();

    // Dismiss cookie banner explicitly if it appears
    const cookieBtn = page.locator('button:has-text("Accept Cookies")');
    if (await cookieBtn.isVisible()) {
      await cookieBtn.click();
    }

    // Locate and click the "View All" button in the Transactions Table
    const viewAllBtn = page.locator('button:has-text("View All →")');
    await expect(viewAllBtn).toBeVisible();
    await viewAllBtn.click({ force: true });

    // Verify expanded data state renders (e.g., an expanded modal, drawer, or full transaction view)
    // TDD Approach: This will fail until we build the expanded view in Step 3!
    await expect(
      page.locator('text=All Transactions').or(page.locator('text=Transaction History'))
    ).toBeVisible({ timeout: 5000 });
  });

});
