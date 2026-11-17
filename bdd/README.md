# Big Yellow, three Cucumber scenarios

Browser tests for https://starface-agentops.vercel.app/. Gherkin is the scenario. Playwright is the browser. Cucumber connects them.

From the repo root, install the browser suite once, then run it:

```bash
npm install --prefix bdd
npx --prefix bdd playwright install chromium
npm run test:headed
```

`npm run test:bdd` runs the same three scenarios with no browser window. `BASE_URL` overrides the site, for example `BASE_URL=http://localhost:3000 npm run test:bdd`.

The HTML report is written to `bdd/reports/cucumber.html`.
