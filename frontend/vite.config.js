/**
 * vite.config.js — Vite configuration for FlashAI React frontend.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // Proxy API requests to FastAPI backend during development.
    // This avoids CORS issues when both run locally.
    proxy: {
      "/upload":     { target: "http://localhost:8000", changeOrigin: true },
      "/flashcards": { target: "http://localhost:8000", changeOrigin: true },
      "/review":     { target: "http://localhost:8000", changeOrigin: true },
      "/health":     { target: "http://localhost:8000", changeOrigin: true },
    },
  },

  build: {
    outDir:     "dist",
    sourcemap:  true,
  },
});