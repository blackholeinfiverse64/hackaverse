const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`PAGE ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`RUNTIME ERROR: ${error.message}`);
  });

  const routes = [
    '/admin',
    '/admin/participants',
    '/admin/submissions',
    '/admin/settings',
    '/admin/register-team',
    '/admin/hackathons',
    '/admin/logs',
    '/admin/rewards',
    '/teams', '/leaderboard',
    '/app/teams',
    '/app/submissions',
    '/app/profile',
    '/join-hackathon',
    '/projects',
    '/hacka-agent'
  ];

  for (const route of routes) {
    console.log(`\nTesting route: ${route}`);
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'test-admin-token');
      localStorage.setItem('userData', JSON.stringify({
        id: 'user1',
        username: 'admin',
        role: 'admin',
        email: 'admin@test.com'
      }));
    });

    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle0' });
    // wait a bit for react to render
    await new Promise(r => setTimeout(r, 1000));
    
    // Check if body is empty or has error overlay
    const content = await page.evaluate(() => {
      return {
        bodyLength: document.body.innerText.length,
        hasErrorOverlay: !!document.querySelector('vite-error-overlay')
      };
    });
    console.log(`Result: Body length ${content.bodyLength}, Has Error: ${content.hasErrorOverlay}`);
  }

  await browser.close();
})();
