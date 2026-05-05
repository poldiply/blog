
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: '2px', DEFAULT: '4px', md: '6px', lg: '8px',
      },
    },
  },
  plugins: [ require('daisyui') ],
  daisyui: {
    themes: [
      {
        light: {
          "color-scheme": "light",
          "primary":           "#3b82f6",   /* soft blue */
          "primary-content":   "#ffffff",
          "secondary":         "#6b7280",
          "secondary-content": "#ffffff",
          "accent":            "#3b82f6",
          "neutral":           "#111827",
          "base-100":          "#ffffff",
          "base-200":          "#fafafa",
          "base-300":          "#f5f5f5",
          "base-content":      "#111827",
          "info":              "#3b82f6",
          "success":           "#16a34a",
          "warning":           "#d97706",
          "error":             "#dc2626",
          "--rounded-box":     "4px",
          "--rounded-btn":     "4px",
          "--rounded-badge":   "3px",
          "--animation-btn":   "0",
          "--animation-input": "0",
          "--btn-focus-scale": "1",
          "--border-btn":      "1px",
        },
      },
      {
        dark: {
          "color-scheme": "dark",
          "primary":           "#f97316",   /* calm orange */
          "primary-content":   "#ffffff",
          "secondary":         "#a3a3a3",
          "secondary-content": "#0a0a0a",
          "accent":            "#fb923c",
          "neutral":           "#ededed",
          "base-100":          "#0a0a0a",
          "base-200":          "#111111",
          "base-300":          "#1a1a1a",
          "base-content":      "#ededed",
          "info":              "#60a5fa",
          "success":           "#4ade80",
          "warning":           "#fbbf24",
          "error":             "#f87171",
          "--rounded-box":     "4px",
          "--rounded-btn":     "4px",
          "--rounded-badge":   "3px",
          "--animation-btn":   "0",
          "--animation-input": "0",
          "--btn-focus-scale": "1",
          "--border-btn":      "1px",
        },
      },
    ],
    darkTheme: "dark",
  },
}