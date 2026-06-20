import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

test('Debug: Admin Login Flow', async ({ page }) => {
  const testAdminEmail = `debug_admin_${Date.now()}@pizzamasterg.com`;
  const defaultPassword = 'testpassword123';
  
  console.log('Creating admin user:', testAdminEmail);
  const { data: adminData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: testAdminEmail,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });
  
  if (createError) {
    console.error('Error creating user:', createError);
  }
  
  try {
    await page.goto(`${BASE_URL}/kitchen-login`);
    await page.fill('input[type="email"]', testAdminEmail);
    await page.fill('input[type="password"]', defaultPassword);
    
    console.log('Clicking submit...');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for URL...');
    await page.waitForURL(/.*admin-dashboard/);
    console.log('Navigated to admin-dashboard!');
    
    await page.waitForTimeout(2000);
    console.log('URL after 2 seconds:', page.url());
    
    const html = await page.content();
    console.log('BODY HTML:', html.substring(0, 1000));
    console.log('BODY HTML END:', html.substring(html.length - 1000));
    
    const dashboardExists = await page.locator('text=Dashboard Overview').isVisible();
    console.log('Is Dashboard Overview visible?', dashboardExists);
    
    await page.screenshot({ path: 'debug-admin-final.png', fullPage: true });
    
  } finally {
    if (adminData?.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(adminData.user.id);
    }
  }
});
