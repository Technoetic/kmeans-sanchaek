// E2E 검증: 3 뷰포트 × 핵심 시나리오. 결과는 step_archive/verify-*.png + 콘솔.
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const BASE = process.env.BASE || 'http://localhost:5173/';
const OUT = path.resolve(__dirname, '..', 'step_archive', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { name: 'desktop', w: 1280, h: 800 },
  { name: 'tablet', w: 768, h: 1024 },
  { name: 'mobile', w: 360, h: 740 },
];

async function runOne(view) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: view.w, height: view.h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#stage', { timeout: 5000 });
  await page.waitForTimeout(400);

  // 초기 상태 스크린샷
  await page.screenshot({
    path: path.join(OUT, `verify-${view.name}-1-initial.png`),
    fullPage: true,
  });

  // 시나리오 1: "할당" 클릭 → 색이 바뀌어야 한다 (phase=ASSIGNED)
  await page.click('#btn-assign');
  await page.waitForTimeout(200);
  let phase = await page.textContent('#phase-readout');
  if (!/할당/.test(phase)) errors.push(`phase after assign != "할당 직후" (got "${phase}")`);

  // 시나리오 2: "평균 갱신" 클릭 → iter +1
  await page.click('#btn-update');
  await page.waitForTimeout(200);
  const iter = await page.textContent('#iter-readout');
  if (Number(iter) !== 1) errors.push(`iter after update != 1 (got "${iter}")`);

  // 시나리오 3: "끝까지" → 수렴
  await page.click('#btn-end');
  await page.waitForTimeout(400);
  phase = await page.textContent('#phase-readout');
  if (!/수렴/.test(phase)) errors.push(`phase after runToEnd != "수렴" (got "${phase}")`);
  await page.screenshot({
    path: path.join(OUT, `verify-${view.name}-2-converged.png`),
    fullPage: true,
  });

  // 시나리오 4: "처음으로" → iter=0
  await page.click('#btn-reset');
  await page.waitForTimeout(150);
  const iter2 = await page.textContent('#iter-readout');
  if (Number(iter2) !== 0) errors.push(`iter after reset != 0 (got "${iter2}")`);

  // 시나리오 5: 데이터셋 토글 + k 변경 (smiley + k=4)
  await page.click('[data-dataset="smiley"]');
  await page.waitForTimeout(150);
  await page.$eval('#k-range', (el) => {
    el.value = '4';
    el.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(200);
  const k = await page.textContent('#k-readout');
  if (k !== '4') errors.push(`k after change != 4 (got "${k}")`);
  await page.click('#btn-end');
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT, `verify-${view.name}-3-smiley-k4.png`),
    fullPage: true,
  });

  await browser.close();
  return { view: view.name, errors };
}

(async () => {
  const results = [];
  for (const v of VIEWS) {
    const r = await runOne(v);
    results.push(r);
  }
  const total = results.reduce((s, r) => s + r.errors.length, 0);
  console.log(JSON.stringify(results, null, 2));
  if (total === 0) {
    console.log(`E2E PASS — ${VIEWS.length} viewports`);
    process.exit(0);
  } else {
    console.log(`E2E FAIL — ${total} errors`);
    process.exit(1);
  }
})().catch((e) => {
  console.error('E2E EXCEPTION', e);
  process.exit(2);
});
