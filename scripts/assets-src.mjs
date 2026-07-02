import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const iconSvg = readFileSync('public/icon.svg','utf8');
const fgSvg = readFileSync('assets/foreground.svg','utf8');
const b = await chromium.launch();
const render = async (svg, out, size, opaque, bg) => {
  const ctx = await b.newContext({ viewport:{width:size,height:size}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  const body = opaque ? `background:${bg}` : '';
  await p.setContent(`<!DOCTYPE html><html><body style="margin:0;${body}"><div style="width:${size}px;height:${size}px">${svg.replace('<svg ',`<svg width="${size}" height="${size}" `)}</div></body></html>`);
  await p.waitForTimeout(120);
  await p.screenshot({ path: out, omitBackground: !opaque });
  await ctx.close();
  console.log('rendered', out);
};
// volledige warme app-icoon (opaque, full-bleed warm)
await render(iconSvg, 'assets/icon-only.png', 1024, true, '#0e0a06');
// android adaptive foreground (transparant symbool)
await render(fgSvg, 'assets/icon-foreground.png', 1024, false);
// android adaptive background (warme vlakke kleur)
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#241a10"/><stop offset="100%" stop-color="#0e0a06"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/></svg>`;
await render(bgSvg, 'assets/icon-background.png', 1024, true, '#0e0a06');
await b.close();
