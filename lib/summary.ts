import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import unfluff from 'unfluff';
import metascraper from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';

const MAX_CHARS = 4000; // LLM 입력 제한

// --- 1. HTML fetch ---
async function tryFetchHTML(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed');
    const html = await res.text();
    return html;
  } catch (err) {
    console.warn('Fetch error:', err);
    return null;
  }
}

// --- 2. Puppeteer fallback (SPA 대응) ---
async function getRenderedHTML(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}

// --- 3. 본문 추출 ---
function extractReadabilityText(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article?.textContent || '';
}

// --- 4. unfluff fallback ---
function extractUnfluffText(html: string) {
  const data = unfluff(html, { language: 'ko' });
  return data.text || '';
}

// --- 5. meta tag 추출 ---
async function extractMeta(html: string, url: string) {
  const scraper = metascraper([metascraperTitle(), metascraperDescription()]);
  const meta = await scraper({ html, url });
  return meta;
}

// --- 6. 텍스트 density fallback ---
function extractDenseText(html: string) {
  const dom = new JSDOM(html);
  const allDivs = Array.from(
    dom.window.document.querySelectorAll('div, p')
  ) as Element[];
  let bestText = '';
  let maxLen = 0;

  for (const el of allDivs) {
    const txt = el.textContent?.trim() || '';
    const len = txt.length;
    if (len > maxLen && len > 50) {
      // 최소 50 chars 필터
      bestText = txt;
      maxLen = len;
    }
  }
  return bestText;
}

// --- 7. 합치고 정리 ---
function mergeAndClean(texts: string[]) {
  const merged = texts.filter(Boolean).join('\n\n');
  // 공백, 중복 줄 제거
  return merged.replace(/\n{2,}/g, '\n').trim();
}

function trimForLLM(text: string, maxLength = MAX_CHARS) {
  if (text.length <= maxLength) return text;
  const half = Math.floor(maxLength / 2);
  return (
    text.substring(0, half) + '\n...\n' + text.substring(text.length - half)
  );
}

export async function extractAndPreprocessUrl(url: string): Promise<string> {
  let html = await tryFetchHTML(url);

  if (!html || html.length < 300) {
    console.log('Falling back to Puppeteer rendering...');
    html = await getRenderedHTML(url);
  }

  // 1차 본문 후보들
  const candidates: string[] = [];

  // meta
  const meta = await extractMeta(html, url);
  if (meta.title) candidates.push(meta.title);
  if (meta.description) candidates.push(meta.description);

  // readability
  const readabilityText = extractReadabilityText(html, url);
  if (readabilityText.length > 200) candidates.push(readabilityText);

  // unfluff
  const unfluffText = extractUnfluffText(html);
  if (unfluffText.length > 200) candidates.push(unfluffText);

  // density fallback
  const denseText = extractDenseText(html);
  if (denseText.length > 50) candidates.push(denseText);

  // merge + clean
  const finalText = trimForLLM(mergeAndClean(candidates));

  return finalText;
}
