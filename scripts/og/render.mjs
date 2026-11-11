import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const template = new URL("./og.html", import.meta.url);
const output = fileURLToPath(new URL("../../public/og.png", import.meta.url));

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(template.href, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
const missing = await page.evaluate(() =>
  ["Bricolage Grotesque", "Literata"].filter((family) => !document.fonts.check(`24px "${family}"`)),
);
if (missing.length > 0) throw new Error(`fonts did not load: ${missing.join(", ")}`);
await page.screenshot({ path: output, type: "png" });
await browser.close();
console.log(`wrote ${output}`);
