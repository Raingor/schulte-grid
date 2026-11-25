import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.GAME_URL || 'http://127.0.0.1:4302/';
const out = fileURLToPath(new URL('../artifacts/', import.meta.url));
const errors = [];
const checks = [];
let failure;

const browser = await chromium.launch({ channel: 'chrome', headless: true });

const check = (name, value) => {
  assert.ok(value, name);
  checks.push(name);
  console.log('PASS', name);
};

async function open(width, height, touch) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: touch,
    hasTouch: touch,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${width} pageerror ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`${width} console ${message.text()}`);
  });
  page.on('requestfailed', request => {
    errors.push(`${width} requestfailed ${request.url()} ${request.failure()?.errorText}`);
  });
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${width} HTTP ${response.status()} ${response.url()}`);
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  return { context, page };
}

const tap = async (page, selector, touch) => {
  const locator = page.locator(selector).first();
  if (touch) await locator.tap();
  else await locator.click();
};

const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

async function valuesOnBoard(page) {
  return page.locator('.cell').evaluateAll(cells => cells.map(cell => Number(cell.dataset.value)));
}

async function playToCompletion(page, touch, size) {
  const total = size * size;
  for (let target = 1; target <= total; target += 1) {
    const button = page.locator(`[data-value="${target}"]`).first();
    if (touch) await button.tap();
    else await button.click();
  }
}

try {
  await mkdir(out, { recursive: true });

  for (const [width, height, touch] of [[1440, 960, false], [390, 844, true], [360, 780, true]]) {
    const label = `${width}${touch ? '-touch' : '-desktop'}`;
    const { context, page } = await open(width, height, touch);

    check(`${label}: title, board and three sizes render`, await page.locator('h1').textContent().then(text => text.includes('找回来'))
      && await page.locator('.cell').count() === 25
      && await page.locator('button[data-size]').count() === 3);
    check(`${label}: 5x5 board is a complete permutation`, await valuesOnBoard(page).then(values => {
      const sorted = [...values].sort((a, b) => a - b);
      return values.length === 25 && sorted.every((value, index) => value === index + 1);
    }));
    check(`${label}: character asset and companion card load`, await page.evaluate(async () => {
      const image = new Image();
      image.src = './characters/classic.webp';
      await image.decode().catch(() => {});
      return image.naturalWidth > 0 && Boolean(document.querySelector('#companion'));
    }));
    check(`${label}: no horizontal overflow at start`, await noOverflow(page));
    await page.screenshot({ path: `${out}/${label}-start.png`, fullPage: true, animations: 'disabled' });

    await tap(page, '#start', touch);
    check(`${label}: start enters playing state`, await page.locator('#game').getAttribute('data-phase').then(phase => phase === 'playing'));
    check(`${label}: timer starts counting`, await page.waitForFunction(() => document.querySelector('#game')?.dataset.elapsed !== '00:00.0', null, { timeout: 2500 }).then(() => true));

    await tap(page, '[data-value="2"]', touch);
    check(`${label}: a wrong tap increments the mistake count`, await page.locator('#game').getAttribute('data-mistakes').then(value => value === '1'));
    check(`${label}: mistake changes the bear mood`, await page.locator('#companion').getAttribute('data-mood').then(mood => mood === 'wobble'));

    await playToCompletion(page, touch, 5);
    check(`${label}: completing 5x5 shows finish state`, await page.locator('#game').getAttribute('data-phase').then(phase => phase === 'complete'));
    check(`${label}: finish card shows a time and mistakes`, await page.locator('#resultTime').textContent().then(text => /\d\d:\d\d\.\d/.test(text)) && await page.locator('#resultMistakes').textContent().then(text => text.includes('1')));
    check(`${label}: complete state changes the bear mood`, await page.locator('#companion').getAttribute('data-mood').then(mood => mood === 'happy'));
    check(`${label}: no horizontal overflow after finish`, await noOverflow(page));
    await page.screenshot({ path: `${out}/${label}-finish.png`, fullPage: true, animations: 'disabled' });

    await page.reload({ waitUntil: 'networkidle' });
    check(`${label}: best time persists after reload`, await page.locator('#bestTime').textContent().then(text => /\d\d:\d\d\.\d/.test(text)));

    await tap(page, '[data-size="7"]', touch);
    check(`${label}: 7x7 board renders 49 unique numbers`, await valuesOnBoard(page).then(values => values.length === 49 && new Set(values).size === 49));
    check(`${label}: progress target resets for the new size`, await page.locator('#progressText').textContent().then(text => text.trim() === '0 / 49'));
    check(`${label}: no horizontal overflow in 7x7`, await noOverflow(page));
    await page.screenshot({ path: `${out}/${label}-7x7.png`, fullPage: true, animations: 'disabled' });

    await tap(page, '[data-size="6"]', touch);
    check(`${label}: 6x6 board renders 36 unique numbers`, await valuesOnBoard(page).then(values => values.length === 36 && new Set(values).size === 36));
    await tap(page, '#restart', touch);
    check(`${label}: restart reshuffles and returns to ready`, await page.locator('#game').getAttribute('data-phase').then(phase => phase === 'ready'));
    check(`${label}: reshuffled 6x6 still complete`, await valuesOnBoard(page).then(values => values.length === 36 && new Set(values).size === 36));
    await context.close();
  }

  const { context, page } = await open(1440, 960, false);
  await page.keyboard.press('Tab');
  check('desktop: keyboard focus is visible on the first control', await page.evaluate(() => {
    const active = document.activeElement;
    return active?.classList.contains('brand') && getComputedStyle(active).outlineStyle !== 'none';
  }));
  await page.locator('#start').focus();
  await page.keyboard.press('Enter');
  check('desktop: keyboard can start the timer', await page.locator('#game').getAttribute('data-phase').then(phase => phase === 'playing'));
  await page.locator('#sound').click();
  check('desktop: sound toggle exposes its pressed state', await page.locator('#sound').getAttribute('aria-pressed').then(value => value === 'false'));
  await context.close();

  const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(base, { waitUntil: 'networkidle' });
  check('reduced motion: animation is effectively disabled', await reducedPage.evaluate(() => {
    const bear = getComputedStyle(document.querySelector('.bear-photo'));
    return parseFloat(bear.transitionDuration) < 0.01;
  }));
  await reduced.close();

  check('no page, console, resource or failed-request errors', errors.length === 0);
} catch (error) {
  failure = error;
  console.error(error);
} finally {
  await writeFile(
    `${out}/browser-results.json`,
    JSON.stringify({ base, checks: checks.length, passed: checks, errors, failure: failure?.message || null }, null, 2),
  );
  await browser.close();
}

if (failure) throw failure;
console.log(`Completed ${checks.length} checks.`);
