import { After, Before, setDefaultTimeout } from "@cucumber/cucumber";
import { chromium } from "@playwright/test";
import { ChatWorld } from "./world.js";

setDefaultTimeout(45_000);

Before(async function (this: ChatWorld) {
  this.browser = await chromium.launch({ headless: process.env.HEADED !== "1" });
  this.page = await this.browser.newPage();
});

After(async function (this: ChatWorld) {
  await this.browser?.close();
});
