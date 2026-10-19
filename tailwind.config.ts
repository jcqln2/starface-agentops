import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { sun: "#FFE135", sunDeep: "#FFD000", ink: "#1a1a1a" },
      fontFamily: { sans: ["ui-rounded", "system-ui", "-apple-system", "Segoe UI", "sans-serif", "Apple Color Emoji", "Noto Color Emoji"] },
    },
  },
} satisfies Config;
