import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const svg = readFileSync('public/icon.svg', 'utf8');
const targets = [
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/apple-touch-icon.png', 180],
  ['public/favicon-32.png', 32],
];
const b = await chromium.launch();
for (const [out, size] of targets) {
  const ctx = await b.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0">
    <div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div></body></html>`);
  await p.waitForTimeout(120);
  await p.screenshot({ path: out, omitBackground: true });
  await ctx.close();
  console.log('icon', out, size);
}
await b.close();
