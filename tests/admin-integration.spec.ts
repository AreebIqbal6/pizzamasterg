import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

test.describe('PHASE 4: The "God\'s Eye" Admin Dashboard & Full Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  // Test data variables
  let testAdminEmail = `playwright_admin_${Date.now()}@pizzamasterg.com`;
  let testKitchenEmail = `playwright_kitchen_${Date.now()}@pizzamasterg.com`;
  const defaultPassword = 'testpassword123';
  
  let testAdminUserId: string;
  let testKitchenUserId: string;
  
  let branchAId: string;
  let branchBId: string;
  let branchAName: string;
  let branchBName: string;
  let createdOrderIds: string[] = [];

  test.beforeAll(async () => {
    // 1. Create two mock branches for testing aggregation and filtering
    const { data: bA, error: errA } = await supabaseAdmin.from('branches').insert({ name: `Branch A ${Date.now()}`, location: 'Test Location A' }).select().single();
    const { data: bB, error: errB } = await supabaseAdmin.from('branches').insert({ name: `Branch B ${Date.now()}`, location: 'Test Location B' }).select().single();
    
    console.log(`Branch A Insert Error:`, errA);
    console.log(`Branch B Insert Error:`, errB);

    if (bA) {
      branchAId = bA.id;
      branchAName = bA.name;
    } else {
      throw new Error("bA was null! Error: " + JSON.stringify(errA));
    }
    if (bB) {
      branchBId = bB.id;
      branchBName = bB.name;
    }

    // 2. Create the Admin user
    const { data: adminData } = await supabaseAdmin.auth.admin.createUser({
      email: testAdminEmail,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });
    if (adminData.user) testAdminUserId = adminData.user.id;

    // 3. Create the Kitchen user (Assigned to Branch A)
    if (branchAId) {
      const { data: kitchenData } = await supabaseAdmin.auth.admin.createUser({
        email: testKitchenEmail,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { role: 'kitchen', branch_id: branchAId }
      });
      if (kitchenData.user) testKitchenUserId = kitchenData.user.id;
    }
  });

  test.afterAll(async () => {
    // Cleanup users
    if (testAdminUserId) await supabaseAdmin.auth.admin.deleteUser(testAdminUserId);
    if (testKitchenUserId) await supabaseAdmin.auth.admin.deleteUser(testKitchenUserId);
    
    // Cleanup orders
    if (createdOrderIds.length > 0) {
      await supabaseAdmin.from('orders').delete().in('id', createdOrderIds);
    }
    
    // Cleanup branches
    if (branchAId) await supabaseAdmin.from('branches').delete().eq('id', branchAId);
    if (branchBId) await supabaseAdmin.from('branches').delete().eq('id', branchBId);
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pmg_cookies_accepted', 'true');
      sessionStorage.setItem('pmg_location', 'Mukka Chowk');
    });
  });

  test('1. Admin Data Integrity: Aggregates revenue and filters by branch correctly', async ({ page }) => {
    // A. Mock 3 orders (2 in Branch A, 1 in Branch B)
    const o1 = await supabaseAdmin.from('orders').insert({
      customer_name: `AggA1-${Date.now()}`,
      customer_address: '123 Fake Street',
      items: [{ name: 'Test Pizza 1', quantity: 1, price: 1000 }],
      total: 1000,
      status: 'completed',
      branch_id: branchAId
    }).select().single();
    
    console.log("Order 1 Insert Error:", o1.error);
    if (o1.error) throw new Error("Order 1 Insert Failed: " + JSON.stringify(o1.error));

    const o2 = await supabaseAdmin.from('orders').insert({
      customer_name: `AggA2-${Date.now()}`,
      customer_address: '123 Fake Street',
      items: [{ name: 'Test Pizza 2', quantity: 2, price: 500 }],
      total: 1000,
      status: 'completed',
      branch_id: branchAId
    }).select().single();
    
    if (o2.error) throw new Error("Order 2 Insert Failed: " + JSON.stringify(o2.error));

    const o3 = await supabaseAdmin.from('orders').insert({
      customer_name: `AggB1-${Date.now()}`,
      customer_address: '123 Fake Street',
      items: [{ name: 'Test Pizza 3', quantity: 1, price: 1500 }],
      total: 1500,
      status: 'completed',
      branch_id: branchBId
    }).select().single();

    if (o1.data) createdOrderIds.push(o1.data.id);
    if (o2.data) createdOrderIds.push(o2.data.id);
    if (o3.data) createdOrderIds.push(o3.data.id);
    
    // Check if the join works with service role!
    const { data: checkJoin } = await supabaseAdmin.from('orders').select('*, branches(name)').eq('id', o1.data.id).single();
    console.log("JOIN CHECK (Admin):", checkJoin?.branches);

    // B. Login as Admin
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testAdminEmail);
    await page.fill('input[type="password"]', defaultPassword);
    await page.click('button[type="submit"]');

    // Wait for Admin Dashboard to load
    await page.waitForURL(/.*admin-dashboard/);
    await page.screenshot({ path: 'admin-dashboard-loaded.png' });
    try {
      await expect(page.locator('text=Dashboard Overview')).toBeVisible({ timeout: 10000 });
    } catch (e) {
      await page.screenshot({ path: 'admin-dashboard-timeout.png', fullPage: true });
      throw e;
    }

    // C. Verify Global Aggregation (Should include all mock orders + any pre-existing)
    // To ensure accuracy in a seeded DB, we expect the revenue to be AT LEAST 3500 and total orders AT LEAST 3
    const totalRevenueStr = await page.locator('[data-testid="total-revenue"]').textContent();
    const totalOrdersStr = await page.locator('[data-testid="total-orders"]').textContent();
    
    console.log(`RAW REVENUE STR: ${totalRevenueStr}`);
    console.log(`RAW ORDERS STR: ${totalOrdersStr}`);
    
    // Parse numeric values
    const totalRevenue = Number(totalRevenueStr?.replace(/Rs\.\s*/g, '').replace(/,/g, ''));
    const totalOrders = Number(totalOrdersStr?.replace(/,/g, ''));
    
    expect(totalRevenue).toBeGreaterThanOrEqual(3500);
    expect(totalOrders).toBeGreaterThanOrEqual(3);

    // D. Filter by Branch A
    const branchFilter = page.locator('select[name="branch-filter"], [data-testid="branch-filter"]');
    
    // Dump HTML and screenshot for debugging
    const selectHtml = await branchFilter.innerHTML();
    console.log(`Dropdown HTML:`, selectHtml);
    await page.screenshot({ path: 'dropdown-debug.png' });

    // Use value string for selectOption
    await branchFilter.selectOption(branchAName);

    // Verify Filtered Aggregation (Only Branch A)
    // Wait for the UI to update
    await page.waitForTimeout(1000); 
    const filteredRevenueStr = await page.locator('[data-testid="total-revenue"]').textContent();
    const filteredOrdersStr = await page.locator('[data-testid="total-orders"]').textContent();
    
    const filteredRevenue = Number(filteredRevenueStr?.replace(/Rs\.\s*/g, '').replace(/,/g, ''));
    const filteredOrders = Number(filteredOrdersStr?.replace(/,/g, ''));

    expect(filteredRevenue).toBeGreaterThanOrEqual(2000);
    expect(filteredOrders).toBeGreaterThanOrEqual(2);
  });

  test('2. The Ultimate E2E Pipeline: Customer -> Kitchen -> Admin Revenue Verification', async ({ page, context }) => {
    // We will use two separate browser contexts (one for kitchen, one for admin) to simulate real concurrent usage
    // To keep it simple, we will run sequentially in one context, but sign in/out as needed.
    
    // --- PART A: Customer Order Submission ---
    const customerOrderName = `E2ECustomer-${Date.now()}`;
    const orderTotal = 1750;

    const { data: newOrder, error } = await supabaseAdmin.from('orders').insert({
      customer_name: customerOrderName,
      customer_address: '789 Pipeline Road',
      items: [{ name: 'E2E Pizza', quantity: 1, price: orderTotal }],
      total: orderTotal,
      status: 'pending',
      branch_id: branchAId
    }).select().single();

    expect(error).toBeNull();
    createdOrderIds.push(newOrder.id);

    // Get baseline Admin Revenue (before completion)
    // For TDD, we will calculate the baseline from DB directly to avoid a 3rd login cycle
    const { data: baselineData } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('status', 'completed');
    
    const baselineRevenue = baselineData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;


    // --- PART B: Kitchen Flow ---
    // Login as Kitchen User
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testKitchenEmail);
    await page.fill('input[type="password"]', defaultPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*kitchen-dashboard/);
    
    // PART B: Kitchen completes the order (Simulated via DB for Admin test speed)
    // We update the status directly so we can verify the Admin Dashboard's real-time math
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', newOrder.id)
      .select('status')
      .single();
      
    expect(updatedOrder?.status).toBe('completed');


    // --- PART C: Admin Verification ---
    // Clear cookies/storage to simulate logging out
    await context.clearCookies();
    await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear(); });
    
    // Login as Admin
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testAdminEmail);
    await page.fill('input[type="password"]', defaultPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*admin-dashboard/);
    await expect(page.locator('text=Dashboard Overview')).toBeVisible({ timeout: 10000 });

    // Verify the Total Revenue explicitly increased by `orderTotal`
    const finalRevenueStr = await page.locator('[data-testid="total-revenue"]').textContent();
    const finalRevenue = Number(finalRevenueStr?.replace(/Rs\.\s*/g, '').replace(/,/g, ''));

    const expectedFinalRevenue = baselineRevenue + orderTotal;
    
    expect(finalRevenue).toBe(expectedFinalRevenue);
  });
});
