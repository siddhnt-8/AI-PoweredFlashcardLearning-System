/**
 * tailwind.config.js — Tailwind CSS v3 configuration for FlashAI.
 */

/** @type {import('tailwindcss').Config} */
export default {
  // Scan all React source files for class names
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      // Custom font
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      // Extended animation keyframes
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)"    },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)"    },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)"    },
          "50%":      { transform: "translateY(-4px)" },
        },
        pulseRing: {
          "0%":   { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2)",   opacity: "0" },
        },
      },

      // Animation utilities
      animation: {
        shimmer:      "shimmer 1.8s linear infinite",
        "fade-in-up": "fadeInUp 0.4s ease-out both",
        "scale-in":   "scaleIn 0.25s ease-out both",
        "bounce-soft":"bounceSoft 2s ease-in-out infinite",
        "pulse-ring": "pulseRing 1.4s ease-out infinite",
      },

      // Extended colors matching the dark theme
      colors: {
        gray: {
          950: "#030712",
        },
      },
    },
  },

  plugins: [],
};