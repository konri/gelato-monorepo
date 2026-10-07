import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep berry — primary brand accent & text
        berry: {
          DEFAULT: "#c026a3",
          light: "#e05bc4",
          dark: "#8a1673",
        },
        // Warm espresso — headings & dark text
        espresso: {
          DEFAULT: "#3a1526",
          light: "#5c2a3d",
          dark: "#25060f",
        },
        // Strawberry pink
        strawberry: "#ff6f91",
        // Pistachio green. `dark` is the text shade (6.3:1 on white).
        pistachio: {
          DEFAULT: "#8bc34a",
          dark: "#3d6b1f",
        },
        // Mango / amber. `dark` is the text shade (6.4:1 on white).
        mango: {
          DEFAULT: "#ffb020",
          dark: "#8a5200",
        },
        // Vanilla cream backgrounds
        cream: {
          DEFAULT: "#fff8f0",
          soft: "#fff1e6",
          deep: "#ffe6d5",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(-3deg)" },
          "50%": { transform: "translateY(-18px) rotate(3deg)" },
        },
        "float-medium": {
          "0%, 100%": { transform: "translateY(0) rotate(4deg)" },
          "50%": { transform: "translateY(-12px) rotate(-2deg)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "float-slow": "float-slow 6s ease-in-out infinite",
        "float-medium": "float-medium 5s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
