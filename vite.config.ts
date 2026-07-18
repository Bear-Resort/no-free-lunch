import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  // GitHub Pages project site: set VITE_BASE=/no-free-lunch/ in CI.
  base: process.env.VITE_BASE || "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@engine": path.resolve(__dirname, "convex/engine"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
