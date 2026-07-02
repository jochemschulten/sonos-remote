import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const RAW = 'store/screenshots/raw';

// per locale: volgorde van [bestand, regel1, accent-regel2]
const LOCALES = {
  'nl-NL': [
    ['01-now',        'Radio op je Sonos.', 'Direct.'],
    ['02-picker',     'Al je zenders,',     'per land.'],
    ['03-nederland',  '144 zenders,',       'één tik weg.'],
    ['05-zoeken',     'Zoek door',          'alles tegelijk.'],
    ['04-favorieten', 'Je favorieten',      'bovenaan.'],
    ['06-wekker',     'Word wakker',        'met je zender.'],
  ],
  'en-US': [
    ['01-now',        'Radio on your Sonos.', 'Instantly.'],
    ['02-picker',     'All your stations,',   'by country.'],
    ['03-nederland',  '144 stations,',        'one tap away.'],
    ['05-zoeken',     'Search across',        'everything.'],
    ['04-favorieten', 'Your favourites',      'up top.'],
    ['06-wekker',     'Wake up to',           'your station.'],
  ],
};

// App Store formaten: 6.7" (verplicht) + 6.9" (soms apart gevraagd)
const SIZES = [
  { dir: 'APP_IPHONE_67', w: 1290, h: 2796 },
  { dir: 'APP_IPHONE_69', w: 1320, h: 2868 },
];

const b64 = (f) => 'data:image/png;base64,' + readFileSync(`${RAW}/${f}.png`).toString('base64');

const html = (img, l1, l2, hero, W, H) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${W}px; height:${H}px; overflow:hidden;
    background:
      radial-gradient(120% 80% at 50% -10%, rgba(255,180,84,0.22), transparent 55%),
      linear-gradient(180deg, #1b130a 0%, #0e0a06 100%);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  .head { padding:150px 110px 0; text-align:center; }
  .head h1 { font-size:104px; line-height:1.06; font-weight:800; letter-spacing:-2px; color:#f3ebdd; }
  .head .acc { color:#ffb454; }
  .stage { display:flex; justify-content:center; margin-top:120px; }
  .phone {
    width:880px; border-radius:74px; padding:16px;
    background:linear-gradient(160deg,#2a2a30,#0c0c0e);
    box-shadow:0 50px 120px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.04);
    ${hero ? 'transform:rotate(-4deg) scale(1.02); transform-origin:center top;' : ''}
  }
  .phone img { width:100%; display:block; border-radius:60px; }
</style></head><body>
  <div class="head"><h1>${l1}<br><span class="acc">${l2}</span></h1></div>
  <div class="stage"><div class="phone"><img src="${img}"></div></div>
</body></html>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1290, height: 2796 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

for (const [locale, slides] of Object.entries(LOCALES)) {
  for (const sz of SIZES) {
    await page.setViewportSize({ width: sz.w, height: sz.h });
    const out = `store/screenshots/${locale}/${sz.dir}`;
    mkdirSync(out, { recursive: true });
    let i = 1;
    for (const [file, l1, l2] of slides) {
      await page.setContent(html(b64(file), l1, l2, i === 1, sz.w, sz.h), { waitUntil: 'load' });
      await page.waitForTimeout(150);
      const dst = `${out}/${String(i).padStart(2, '0')}-${file.slice(3)}.png`;
      await page.screenshot({ path: dst });
      console.log('framed', dst);
      i++;
    }
  }
}
await browser.close();
console.log('done');
