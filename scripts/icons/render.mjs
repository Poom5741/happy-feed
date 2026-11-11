import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const template = new URL("./icon.html", import.meta.url).href;
const out = (name) => fileURLToPath(new URL(`../../public/icons/${name}`, import.meta.url));

// [file, size in px, shape]
const ICONS = [
  ["icon-192.png", 192, "rounded"],
  ["icon-512.png", 512, "rounded"],
  ["maskable-512.png", 512, "maskable"],
  ["apple-touch-icon.png", 180, "square"],
];

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(template, { waitUntil: "load" });
for (const [file, size, shape] of ICONS) {
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: size / 512 });
  await page.evaluate((s) => (document.querySelector(".icon").className = `icon ${s}`), shape);
  const icon = await page.$(".icon");
  await icon.screenshot({ path: out(file), omitBackground: true });
  console.log(`wrote public/icons/${file}`);
}
await browser.close();
