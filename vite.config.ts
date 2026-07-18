import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
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
