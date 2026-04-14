import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#954f1f"
      }
    }
  },
  plugins: []
} satisfies Config;

