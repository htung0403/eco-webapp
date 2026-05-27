const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => logs.push(`[PAGE_ERROR] ${error.message}`));
  
  try {
    await page.goto('http://localhost:5173/', { timeout: 10000, waitUntil: 'load' });
  } catch (e) {
    logs.push(`[GOTO_ERROR] ${e.message}`);
  }
  
  // Wait a bit to catch any infinite reloads or async errors
  await page.waitForTimeout(3000);
  
  console.log("=== BROWSER LOGS ===");
  console.log(logs.join('\n'));
  
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log("=== BODY HTML ===");
  console.log(bodyHTML);
  
  await browser.close();
})();
