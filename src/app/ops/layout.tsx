import type { Metadata } from "next";

export const metadata: Metadata = { title: "big yellow agent dashboard" };

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
