import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#26222f",
        paper: "#fff8ec",
        ticket: "#f5d06f",
        coral: "#ef6f6c",
        lagoon: "#2aa7a1",
        skywash: "#bfe4f8",
        leaf: "#5f9d66",
        plum: "#6d5bd0"
      },
      boxShadow: {
        sketch: "3px 3px 0 #26222f",
        soft: "0 18px 50px rgba(38, 34, 47, 0.12)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
