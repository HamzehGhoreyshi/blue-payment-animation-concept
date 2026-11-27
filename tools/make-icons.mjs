// Renders public/favicon.svg to the PNG icons. Needs Chrome + `npm i --no-save puppeteer-core`.
//   node tools/make-icons.mjs .
import puppeteer from 'puppeteer-core';
import { readFile } from 'node:fs/promises';
const [dir] = process.argv.slice(2);
const svg = await readFile(`${dir}/public/favicon.svg`, 'utf8');
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p = await b.newPage();
for (const [name, size, pad] of [['favicon-32.png', 32, 0], ['apple-touch-icon.png', 180, 0]]) {
  await p.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await p.screenshot({ path: `${dir}/public/${name}`, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
await b.close();
