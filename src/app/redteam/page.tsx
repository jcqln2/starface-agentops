"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Convenience route: fires the preset adversarial set, then lands on the dashboard. */
export default function RedTeamPage() {
  const router = useRouter();
  const [status, setStatus] = useState("firing 8 adversarial prompts…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch("/api/redteam", { method: "POST" });
        if (!cancelled) router.replace("/ops");
      } catch {
        if (!cancelled) setStatus("red team run failed. is the server up?");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  return <main className="mx-auto max-w-xl px-6 py-20 text-center text-lg font-bold">{status}</main>;
}
