/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'Inter'", "sans-serif"],
      },
      colors: {
        bg: "#0a0a0f",
        surface: "#111118",
        border: "#1e1e2e",
        accent: "#7c6af7",
        "accent-dim": "#4a3fa8",
        muted: "#3a3a4a",
        text: "#e2e2f0",
        "text-dim": "#7a7a9a",
        success: "#4ade80",
        warning: "#facc15",
        danger: "#f87171",
      },
    },
  },
  plugins: [],
};
