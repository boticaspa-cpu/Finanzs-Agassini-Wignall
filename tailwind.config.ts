import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        calm: "var(--color-calm)",
        card: "var(--color-card)",
        emergency: "#dc2626",
        alert: "#a16207",
        stable: "#4f6f35",
        forest: "var(--color-forest)",
        olive: "var(--color-olive)"
      },
      boxShadow: {
        soft: "var(--shadow-soft)"
      }
    }
  },
  plugins: []
};

export default config;
