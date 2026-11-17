import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { ChatWorld } from "../support/world.js";

const baseUrl = process.env.BASE_URL ?? "https://starface-agentops.vercel.app";

Given("I open the chat", async function (this: ChatWorld) {
  await this.page.goto(baseUrl);
});

Given("I open the agent dashboard", async function (this: ChatWorld) {
  await this.page.goto(`${baseUrl}/ops`);
});

When("I ask {string}", async function (this: ChatWorld, question: string) {
  await this.page.getByRole("button", { name: question }).click();
});

Then("I see the greeting {string}", async function (this: ChatWorld, greeting: string) {
  await expect(this.page.getByText(greeting, { exact: false })).toBeVisible();
});

Then("I see {int} suggested questions", async function (this: ChatWorld, count: number) {
  const suggestions = this.page.getByRole("button").filter({ hasNotText: /^send$/ });
  await expect(suggestions).toHaveCount(count);
});

Then("the agent dashboard link is visible", async function (this: ChatWorld) {
  await expect(this.page.getByRole("link", { name: "big yellow agent dashboard" })).toBeVisible();
});

Then("the reply includes {string}", async function (this: ChatWorld, text: string) {
  const replies = this.page.locator("[data-role='assistant']");
  await expect(replies.filter({ hasText: text })).toHaveCount(1, { timeout: 30_000 });
});

Then("the reply is labeled {string}", async function (this: ChatWorld, label: string) {
  await expect(this.page.getByText(label, { exact: true }).first()).toBeVisible();
});

Then("I see {string}", async function (this: ChatWorld, text: string) {
  await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();
});
