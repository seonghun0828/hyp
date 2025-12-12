import puppeteer, { HTTPRequest, Browser } from 'puppeteer';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const MAX_CHARS = 4000;

// 고유 라벨 생성 함수
const uniqueLabel = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

/* ---------------------------------------
    0. Puppeteer Browser Singleton
---------------------------------------- */
let _browser: Browser | null = null;

async function getBrowser() {
  // 1. 기존 브라우저가 있고 연결이 끊겼다면 초기화
  if (_browser && !_browser.isConnected()) {
    console.log('Browser disconnected, resetting...');
    _browser = null;
  }

  // 2. 이미 살아있는 브라우저가 있으면 재사용
  if (_browser) return _browser;

  const label = uniqueLabel('LAUNCH');
  console.time(label);

  try {
    if (process.env.NODE_ENV === 'production') {
      // 배포 환경 (Vercel)
      const chromium = (await import('@sparticuz/chromium')).default;
      const puppeteerCore = (await import('puppeteer-core')).default;

      // 추가 폰트 로딩 (옵션) - 한글 깨짐 방지 위해 필요할 수 있음
      // await chromium.font('https://raw.githack.com/googlei18n/noto-cjk/master/NotoSansCJK-Regular.ttc');

      _browser = (await puppeteerCore.launch({
        args: [
          ...chromium.args,
          '--no-first-run',
          '--no-zygote',
          '--window-size=1920,1080',
        ],
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: true,
      })) as unknown as Browser;
    } else {
      // 로컬 환경
      _browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--window-size=1920,1080',
        ],
      });
    }

    // 3. 브라우저가 갑자기 죽었을 때 변수 초기화하는 리스너 등록
    _browser.on('disconnected', () => {
      console.log('Browser disconnected event');
      _browser = null;
    });
  } catch (error) {
    console.error('Failed to launch browser:', error);
    _browser = null;
    throw error;
  }

  console.timeEnd(label);
  return _browser;
}

/* ---------------------------------------
    1. HTML Fetch
---------------------------------------- */
async function tryFetchHTML(url: string) {
  const label = uniqueLabel('fetchHTML');
  console.time(label);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed');
    const text = await res.text();
    console.timeEnd(label);
    return text;
  } catch (err) {
    console.warn('Fetch error:', err);
    console.timeEnd(label);
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
// stylesheet와 font는 차단 목록에서 제거 (렌더링 문제 방지)
const BLOCK_RESOURCE_TYPES = new Set(['image', 'media']);
const BLOCKED_HOSTS = [
  'googlesyndication.com',
  'doubleclick.net',
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'adsystem.com',
];

async function getRenderedHTML(url: string) {
  const suffix = Math.random().toString(36).slice(2, 9);
  const labelPuppeteer = `puppeteer-${suffix}`;
  const labelGoto = `GOTO-${suffix}`;
  const labelContent = `CONTENT-${suffix}`;

  console.time(labelPuppeteer);

  let browser;
  let page;

  try {
    browser = await getBrowser();
    page = await browser.newPage();

    // User-Agent 설정 (봇 탐지 우회)
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

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

    page.setDefaultNavigationTimeout(15000); // 15초로 증가

    console.time(labelGoto);
    // networkidle2: 네트워크 연결이 2개 이하로 떨어질 때까지 대기 (SPA 로딩 대기)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    console.timeEnd(labelGoto);

    // 빠른 렌더링 보조
    try {
      await Promise.race([
        page.waitForSelector('main, article, [role="main"]', { timeout: 3000 }),
        new Promise((res) => setTimeout(res, 1000)),
      ]);
    } catch {}

    console.time(labelContent);
    const html = await page.content();
    console.timeEnd(labelContent);

    return html;
  } catch (error) {
    console.error(`Puppeteer error (${url}):`, error);
    throw error;
  } finally {
    if (page) await page.close().catch(() => {});
    console.timeEnd(labelPuppeteer);
  }
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
    try {
      html = await getRenderedHTML(url);
    } catch (error) {
      console.error('Puppeteer fallback failed:', error);
      if (!html) html = '';
    }
  }

  const htmlString = html as string;

  const labelExtractors = uniqueLabel('extractors');
  console.time(labelExtractors);
  const [meta, readabilityText, denseText] = await Promise.all([
    extractMeta(htmlString, url),
    Promise.resolve(extractReadabilityText(htmlString, url)),
    Promise.resolve(extractDenseText(htmlString)),
  ]);
  console.timeEnd(labelExtractors);

  const candidates: string[] = [];

  if (meta.title) candidates.push(meta.title);
  if (meta.description) candidates.push(meta.description);
  if (readabilityText.length > 200) candidates.push(readabilityText);
  if (denseText.length > 50) candidates.push(denseText);

  const finalText = trimForLLM(mergeAndClean(candidates));

  console.log('END extract');
  return finalText;
}
