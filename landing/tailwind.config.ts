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
        background: "#FAFAFA",
        foreground: "#0A0A0A",
        accent: "#3B82F6",
        "accent-blue": "#3B82F6",
        "accent-violet": "#8B5CF6",
        "accent-lime": "#A3E635",
        border: "#E5E5E5",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "7xl": "4.5rem",
      },
      backgroundImage: {
        "gradient-upcreate": "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
        "gradient-lime": "linear-gradient(135deg, #A3E635 0%, #3B82F6 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
