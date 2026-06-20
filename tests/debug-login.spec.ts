import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

test('Debug: Kitchen Login Flow', async ({ page }) => {
  // Create a test user
  const testEmail = `debug_${Date.now()}@pizzamasterg.com`;
  const testPassword = 'testpassword123';
  
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { role: 'kitchen', branch_id: '00000000-0000-0000-0000-000000000001' }
  });
  
  console.log('Created user:', userData?.user?.id, 'Error:', createError?.message);
  
  try {
    await page.goto(`${BASE_URL}/kitchen-login`);
    
    // Take screenshot of the login page
    await page.screenshot({ path: 'debug-login-page.png' });
    console.log('Login page URL:', page.url());
    
    // Check what's in the DOM
    const formAction = await page.$eval('form', (f) => (f as HTMLFormElement).action).catch(() => 'no form');
    const buttonType = await page.$eval('button[type="submit"]', (b) => (b as HTMLButtonElement).type).catch(() => 'no button');
    console.log('Form action:', formAction, 'Button type:', buttonType);
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Listen for network requests
    const requests: string[] = [];
    page.on('request', req => requests.push(`${req.method()} ${req.url()}`));
    page.on('response', res => requests.push(`  -> ${res.status()} ${res.url()}`));
    
    await page.click('button[type="submit"]');
    
    // Wait 5 seconds and take screenshot
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'debug-after-submit.png' });
    console.log('After submit URL:', page.url());
    console.log('Network requests:', requests);
    
    await expect(page).toHaveURL(/.*kitchen-dashboard/, { timeout: 5000 }).catch(async () => {
      await page.screenshot({ path: 'debug-timeout.png', fullPage: true });
      const html = await page.content();
      console.log('Page content snippet:', html.substring(0, 500));
    });
  } finally {
    if (userData?.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    }
  }
});
