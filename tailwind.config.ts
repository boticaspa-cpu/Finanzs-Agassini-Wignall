import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#173828",
        calm: "#eef3ed",
        emergency: "#dc2626",
        alert: "#a16207",
        stable: "#4f6f35",
        forest: "#244b35",
        olive: "#6f7f3f"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23, 56, 40, 0.11)"
      }
    }
  },
  plugins: []
};

export default config;
