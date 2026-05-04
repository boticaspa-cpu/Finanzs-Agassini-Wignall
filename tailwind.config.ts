import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        calm: "#f5f7f8",
        emergency: "#dc2626",
        alert: "#d97706",
        stable: "#15803d"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
