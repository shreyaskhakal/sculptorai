import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        surface: {
          50: "#181B24",
          100: "#13151D",
          200: "#0E1017",
          300: "#0A0B10",
        },
        border: {
          subtle: "#1B1F2A",
          DEFAULT: "#262C3D",
          strong: "#3B445D",
        },
        blender: {
          DEFAULT: "#F5792A",
          hover: "#E0681B",
          dark: "#B84E0B",
          glow: "rgba(245, 121, 42, 0.15)",
        },
        cyan: {
          DEFAULT: "#00E5FF",
          glow: "rgba(0, 229, 255, 0.15)",
        },
        emerald: {
          DEFAULT: "#10B981",
          glow: "rgba(16, 185, 129, 0.15)",
        },
        amber: {
          DEFAULT: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.15)",
        },
        rose: {
          DEFAULT: "#F43F5E",
          glow: "rgba(244, 63, 94, 0.15)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "SFMono-Regular",
          "Consolas",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glow-orange": "0 0 20px -3px rgba(245, 121, 42, 0.25)",
        "glow-cyan": "0 0 20px -3px rgba(0, 229, 255, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
