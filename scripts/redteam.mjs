// Fires the preset adversarial set at a running server and prints a summary.
const base = process.env.BASE_URL ?? "http://localhost:3000";
const res = await fetch(`${base}/api/redteam`, { method: "POST" });
const { events } = await res.json();
for (const e of events) {
  const reasons = e.checks.flatMap((c) => c.reasons).join(", ") || "-";
  console.log(`${e.verdict.padEnd(9)} ${e.agent.padEnd(10)} ${e.userMessage}\n          ↳ ${reasons}`);
}
