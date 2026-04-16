const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Capture network requests
  page.on('response', response => {
    if (response.url().includes('/api/admin/users')) {
      console.log('Response status:', response.status());
      console.log('Response body:', response.url());
      response.text().then(body => {
        console.log('Response text:', body.substring(0, 500));
      });
    }
  });

  try {
    // Go to login
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

    // Fill login form
    console.log('Filling login form...');
    await page.fill('#email', 'dev@local.test');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type=submit]');

    // Wait for navigation
    console.log('Waiting for login...');
    await page.waitForTimeout(3000);

    // Navigate to user management
    console.log('Navigating to user management...');
    await page.goto('http://localhost:5173/admin/users', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // Get page content
    const bodyText = await page.locator('body').innerText();
    console.log('Page text (first 2000 chars):', bodyText.substring(0, 2000));

    // Check for user count
    const totalText = await page.locator('text=Total Users').first().textContent().catch(() => 'not found');
    console.log('Total Users label:', totalText);

  } catch (err) {
    console.error('Error:', err.message);
  }

  await browser.close();
})();
