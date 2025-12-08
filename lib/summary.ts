import puppeteer, { HTTPRequest, Browser } from 'puppeteer';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const MAX_CHARS = 4000;

/* ---------------------------------------
    0. Puppeteer Browser Singleton
---------------------------------------- */
let _browser: Browser | null = null;

async function getBrowser() {
  if (_browser) return _browser;

  console.time('LAUNCH');

  _browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  console.timeEnd('LAUNCH');

  return _browser;
}

/* ---------------------------------------
    1. HTML Fetch
---------------------------------------- */
async function tryFetchHTML(url: string) {
  console.time('fetchHTML');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed');
    const text = await res.text();
    console.timeEnd('fetchHTML');
    return text;
  } catch (err) {
    console.warn('Fetch error:', err);
    console.timeEnd('fetchHTML');
    return null;
  }
}

/* ---------------------------------------
    2. SPA Detection
---------------------------------------- */
function looksLikeSPA(html: string) {
  if (!html) return true;

  const lower = html.toLowerCase();

  return (
    lower.length < 2000 ||
    lower.includes('__next_data__') ||
    lower.includes('id="__next"') ||
    lower.includes('id="app"') ||
    lower.includes('id="root"') ||
    (lower.match(/<script/gi)?.length ?? 0) > 20
  );
}

/* ---------------------------------------
    3. Puppeteer Optimized Renderer
---------------------------------------- */
const BLOCK_RESOURCE_TYPES = new Set(['image', 'media', 'font', 'stylesheet']);
const BLOCKED_HOSTS = [
  'googlesyndication.com',
  'doubleclick.net',
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'adsystem.com',
];

async function getRenderedHTML(url: string) {
  console.time('puppeteer');

  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (req: HTTPRequest) => {
    try {
      const urlObj = new URL(req.url());
      const host = urlObj.hostname;

      if (BLOCK_RESOURCE_TYPES.has(req.resourceType())) {
        req.abort();
        return;
      }
      if (BLOCKED_HOSTS.some((h) => host.includes(h))) {
        req.abort();
        return;
      }
      req.continue();
    } catch {
      req.continue();
    }
  });

  page.setDefaultNavigationTimeout(8000);

  console.time('GOTO');

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  console.timeEnd('GOTO');

  // 빠른 렌더링 보조: main/article가 있으면 기다리고, 없으면 0.5s만 기다림
  try {
    await Promise.race([
      page.waitForSelector('main, article, [role="main"]', { timeout: 2000 }),
      new Promise((res) => setTimeout(res, 500)),
    ]);
  } catch {}

  console.time('CONTENT');
  const html = await page.content();
  console.timeEnd('CONTENT');

  await page.close();

  console.timeEnd('puppeteer');
  return html;
}

/* ---------------------------------------
    4. Content Extractors
---------------------------------------- */
function extractReadabilityText(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article?.textContent || '';
}

async function extractMeta(html: string, url: string) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  return {
    title: doc.querySelector('title')?.textContent || '',
    description:
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      '',
  };
}

function extractDenseText(html: string) {
  const dom = new JSDOM(html);
  const els = Array.from(
    dom.window.document.querySelectorAll('div, p')
  ) as HTMLElement[];

  let best = '';
  let max = 0;

  for (const el of els) {
    const text = el.textContent?.trim() || '';
    if (text.length > max && text.length > 50) {
      best = text;
      max = text.length;
    }
  }
  return best;
}

/* ---------------------------------------
    5. Merge & Trim
---------------------------------------- */
function mergeAndClean(texts: string[]) {
  const merged = texts.filter(Boolean).join('\n\n');
  return merged.replace(/\n{2,}/g, '\n').trim();
}

function trimForLLM(text: string) {
  if (text.length <= MAX_CHARS) return text;

  const half = Math.floor(MAX_CHARS / 2);
  return text.slice(0, half) + '\n...\n' + text.slice(text.length - half);
}

/* ---------------------------------------
    6. Main Function
---------------------------------------- */
export async function extractAndPreprocessUrl(url: string): Promise<string> {
  console.log('START extract:', url);

  let html = await tryFetchHTML(url);

  if (!html || looksLikeSPA(html)) {
    console.log('SPA detected → Puppeteer fallback');
    html = await getRenderedHTML(url);
  }

  const htmlString = html as string;

  console.time('extractors');
  const [meta, readabilityText, denseText] = await Promise.all([
    extractMeta(htmlString, url),
    Promise.resolve(extractReadabilityText(htmlString, url)),
    Promise.resolve(extractDenseText(htmlString)),
  ]);
  console.timeEnd('extractors');

  const candidates: string[] = [];

  if (meta.title) candidates.push(meta.title);
  if (meta.description) candidates.push(meta.description);
  if (readabilityText.length > 200) candidates.push(readabilityText);
  if (denseText.length > 50) candidates.push(denseText);

  const finalText = trimForLLM(mergeAndClean(candidates));

  console.log('END extract');
  return finalText;
}
