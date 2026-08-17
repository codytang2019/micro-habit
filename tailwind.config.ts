import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FBF3EA",
        "paper-deep": "#F3E1CC",
        "paper-card": "#FFFFFF",
        ink: "#2B2320",
        "ink-soft": "#8A7A6D",
        "ink-faint": "#BBA995",
        stamp: "#C85C2E",
        "stamp-deep": "#A84A24",
        moss: "#3C8452",
        gold: "#E0A428",
        indigo: "#5468C4",
        clay: "#C1567A",
        partial: "#D9762F",
        missed: "#B0937A",
        line: "#F0D6BA",
        "line-soft": "#F7E7D6",
      },
      fontFamily: {
        serif: ["'Noto Serif TC'", "serif"],
        sans: ["'Noto Sans TC'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
