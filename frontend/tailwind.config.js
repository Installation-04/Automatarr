/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["Exo 2", "system-ui", "sans-serif"],
        display: ["Orbitron", "system-ui", "sans-serif"],
        mono:    ["Share Tech Mono", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#07001a",
          1: "#0d0025",
          2: "#130030",
          3: "#19003b",
          4: "#200046",
        },
        neon: {
          pink:   "#ff006e",
          cyan:   "#00f5ff",
          purple: "#b14fff",
          yellow: "#ffe600",
          orange: "#ff7700",
          green:  "#00ff88",
        },
      },
      boxShadow: {
        "neon-pink":   "0 0 8px rgba(255,0,110,0.9), 0 0 24px rgba(255,0,110,0.5), 0 0 48px rgba(255,0,110,0.2)",
        "neon-cyan":   "0 0 8px rgba(0,245,255,0.9), 0 0 24px rgba(0,245,255,0.5), 0 0 48px rgba(0,245,255,0.2)",
        "neon-purple": "0 0 8px rgba(177,79,255,0.9), 0 0 24px rgba(177,79,255,0.5), 0 0 48px rgba(177,79,255,0.2)",
        "neon-green":  "0 0 8px rgba(0,255,136,0.9), 0 0 24px rgba(0,255,136,0.5)",
        "neon-yellow": "0 0 8px rgba(255,230,0,0.9), 0 0 24px rgba(255,230,0,0.5)",
        "neon-orange": "0 0 8px rgba(255,119,0,0.9), 0 0 24px rgba(255,119,0,0.5)",
        "card":        "0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,0,110,0.08)",
      },
      animation: {
        "fade-in":   "fadeIn 0.25s ease-out",
        "flicker":   "flicker 4s ease-in-out infinite",
        "pulse-pink":"pulsePink 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        flicker:   { "0%,100%": { opacity: "1" }, "92%": { opacity: "1" }, "93%": { opacity: "0.8" }, "94%": { opacity: "1" }, "96%": { opacity: "0.9" }, "97%": { opacity: "1" } },
        pulsePink: { "0%,100%": { boxShadow: "0 0 8px rgba(255,0,110,0.6)" }, "50%": { boxShadow: "0 0 24px rgba(255,0,110,0.9), 0 0 48px rgba(255,0,110,0.4)" } },
      },
    },
  },
  plugins: [],
};
