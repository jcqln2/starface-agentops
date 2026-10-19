// Headless screenshots: a multi-turn chat with product cards, then the dashboard.
// Run with the server up: node scripts/screenshots.mjs
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const CHAT = [
  "i've got a big breakout before a party friday, what's my game plan?",
  "can i wear hydro-stars under makeup?",
  "which patch is best for tiny bumps on my chin?",
  "where's my order #1234",
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1100, height: 1880 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("PAGEERR", e.message));

await page.goto(base, { waitUntil: "networkidle" });
for (const msg of CHAT) {
  const before = await page.locator('[data-role="assistant"]').count();
  await page.fill("input", msg);
  await page.click("button:has-text('send')");
  await page.waitForFunction((n) => document.querySelectorAll('[data-role="assistant"]').length > n, before, { timeout: 15000 });
}
await page.waitForLoadState("networkidle"); // product thumbnails
await page.waitForTimeout(800);
await page.screenshot({ path: "screenshots/chat.png" });

// a real tap on a product card: goes through /api/click, then opens starface.world in a new tab
const [tab] = await Promise.all([ctx.waitForEvent("page"), page.locator('a[href^="/api/click"]').first().click()]);
await tab.waitForLoadState("domcontentloaded").catch(() => {});
console.log("card click landed on", tab.url());
await tab.close();

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${base}/ops`, { waitUntil: "networkidle" });
await page.waitForSelector("tbody tr");
await page.waitForTimeout(500);
await page.screenshot({ path: "screenshots/ops.png", fullPage: true });
await page.locator("tbody tr").filter({ hasText: "retinol" }).first().click();
await page.waitForSelector("text=original draft");
await page.screenshot({ path: "screenshots/ops-detail.png" });
await browser.close();
console.log("saved screenshots/chat.png, ops.png, ops-detail.png");
