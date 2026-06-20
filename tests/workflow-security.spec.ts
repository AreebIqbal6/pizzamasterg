import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';

test.describe('PHASE 3: Order Fulfillment & Strict Role-Based Security', () => {
  test.describe.configure({ mode: 'serial' });

  // Database credentials for raw queries
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // Setup Supabase Admin Client to bypass RLS and mock data
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const testKitchenEmail = `playwright_kitchen_${Date.now()}@pizzamasterg.com`;
  const testKitchenPassword = 'kitchenpassword123';
  let testKitchenUserId: string;
  let testBranchId: string;

  test.beforeAll(async () => {
    // 1. Create a mock branch for testing RLS
    const { data: branchData, error: branchError } = await supabaseAdmin
      .from('branches')
      .insert({ name: `Test Branch ${Date.now()}`, location: 'Test Location' })
      .select()
      .single();
    
    if (branchError) {
      console.error('Error creating mock branch:', branchError);
    } else if (branchData) {
      testBranchId = branchData.id;
    }

    // 2. Create the kitchen user and assign the branch_id in user_metadata
    if (testBranchId) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testKitchenEmail,
        password: testKitchenPassword,
        email_confirm: true,
        user_metadata: { role: 'kitchen', branch_id: testBranchId }
      });

      if (error) {
        console.error('Error creating kitchen user:', error);
      } else if (data.user) {
        testKitchenUserId = data.user.id;
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    // Inject cookies accepted to bypass banner
    await page.addInitScript(() => {
      localStorage.setItem('pmg_cookies_accepted', 'true');
      sessionStorage.setItem('pmg_location', 'Mukka Chowk');
    });
  });

  test.afterAll(async () => {
    // Cleanup the mock Kitchen user
    if (testKitchenUserId) {
      await supabaseAdmin.auth.admin.deleteUser(testKitchenUserId);
    }
  });

  test('1. Order State Mutations (Kitchen Workflow): Updates status in UI and Database', async ({ page }) => {
    // Inject mock order into database BEFORE login to avoid realtime subscription race condition
    const mockOrderName = `TestCustomer-${Date.now()}`;
    const { data: orderData, error } = await supabaseAdmin.from('orders').insert({
      customer_name: mockOrderName,
      customer_address: '123 Test Street, Karachi',
      items: [{ name: 'Test Pizza', quantity: 1, price: 1000 }],
      total: 1000,
      status: 'pending',
      branch_id: testBranchId
    }).select().single();

    expect(error).toBeNull();
    expect(orderData).toBeDefined();

    // Login to Kitchen Dashboard
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testKitchenEmail);
    await page.fill('input[type="password"]', testKitchenPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*kitchen-dashboard/, { timeout: 30000 });

    expect(error).toBeNull();
    expect(orderData).toBeDefined();

    // Verify order appears in UI
    const orderCard = page.locator(`text=${mockOrderName}`).locator('..').locator('..');
    await expect(orderCard).toBeVisible({ timeout: 30000 });

    // Locate the "View Details" button for this specific order
    const viewDetailsBtn = orderCard.locator('button', { hasText: /View Details/i }).first();
    await expect(viewDetailsBtn).toBeVisible({ timeout: 15000 });
    await viewDetailsBtn.click({ force: true });

    // Now find the Accept/Preparing button inside the drawer
    const acceptBtn = page.locator('button', { hasText: /(Accept|Preparing|Start)/i }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 15000 });
    await acceptBtn.click({ force: true });

    // Verify UI reflects the updated status (e.g. drawer changes or table row changes)
    // For example, looking for a badge or text indicating it is now "preparing"
    await expect(orderCard.locator('text=preparing').first()).toBeVisible({ timeout: 5000 });

    // Verify database was actually mutated
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', orderData.id)
      .single();

    expect(updatedOrder?.status).toBe('preparing');

    // Clean up
    await supabaseAdmin.from('orders').delete().eq('id', orderData.id);
  });

  test('2. Cross-Role Contamination (RBAC Security): Kitchen user rejected from Admin Dashboard', async ({ page }) => {
    // Ensure we are logged in as Kitchen user
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testKitchenEmail);
    await page.fill('input[type="password"]', testKitchenPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*kitchen-dashboard/);

    // Attempt to forcefully navigate to Admin Dashboard
    await page.goto(`${BASE_URL}/admin-dashboard`);

    // Verify the system outright rejects access
    // This could be a redirect to home/kitchen or a 403 Forbidden page
    // We'll assert that we are NOT on the admin dashboard by checking URL or visibility of admin elements
    await page.waitForURL((url) => {
      return !url.toString().includes('admin-dashboard') || url.toString().includes('login');
    }, { timeout: 10000 }).catch(() => null);

    const currentUrl = page.url();
    const isAdmin = currentUrl.includes('admin-dashboard');
    
    // If it didn't redirect, it must show an unauthorized/403 message
    if (isAdmin) {
      const unauthorizedText = page.locator('text=Unauthorized');
      const forbiddenText = page.locator('text=Forbidden');
      const accessDeniedText = page.locator('text=Access Denied');
      
      const isBlocked = await unauthorizedText.isVisible() || 
                        await forbiddenText.isVisible() || 
                        await accessDeniedText.isVisible();
      
      expect(isBlocked, 'Admin dashboard should be blocked for Kitchen users').toBeTruthy();
    } else {
      expect(isAdmin).toBeFalsy();
    }
  });

  test('3. Edge Case - Empty States: Handles zero active orders gracefully', async ({ page }) => {
    // Delete all orders briefly to simulate an empty state
    // We clear all pending/preparing orders.
    const { error: deleteError } = await supabaseAdmin.from('orders').delete().in('status', ['pending', 'preparing', 'ready']);
    expect(deleteError).toBeNull();

    // Login to Kitchen Dashboard
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testKitchenEmail);
    await page.fill('input[type="password"]', testKitchenPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*kitchen-dashboard/);

    // Verify graceful empty state UI
    // Usually something like "No active orders", "All caught up!", or an empty table without crash
    const emptyStateIndicator = page.locator('text=/(No active orders|All caught up|No orders found|No pending orders)/i').first();
    await expect(emptyStateIndicator).toBeVisible({ timeout: 10000 });

    // Verify there are no order cards or infinite spinners
    const spinner = page.locator('.spinner, [role="status"]');
    await expect(spinner).not.toBeVisible();
  });
});
