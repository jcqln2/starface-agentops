# Big Yellow, three Cucumber scenarios

Browser tests for https://starface-agentops.vercel.app/. Gherkin is the scenario. Playwright is the browser. Cucumber connects them.

```bash
cd bdd
npm install
npx playwright install chromium
npm test
```

`HEADED=1 npm run test:headed` shows the browser. `BASE_URL` overrides the site, for example `BASE_URL=http://localhost:3000 npm test`.

The HTML report is written to `bdd/reports/cucumber.html`.
