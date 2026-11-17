import { World, setWorldConstructor, type IWorldOptions } from "@cucumber/cucumber";
import type { Browser, Page } from "@playwright/test";

export class ChatWorld extends World {
  browser!: Browser;
  page!: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(ChatWorld);
