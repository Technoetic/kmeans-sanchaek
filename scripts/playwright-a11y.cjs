// axe-core 접근성 스캔. 위반 0 목표.
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const BASE = process.env.BASE || 'http://localhost:5173/';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#stage');
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  console.log(
    JSON.stringify(
      {
        total: results.violations.length,
        blocking: blocking.length,
        details: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
        })),
      },
      null,
      2,
    ),
  );
  await browser.close();
  process.exit(blocking.length === 0 ? 0 : 1);
})();
