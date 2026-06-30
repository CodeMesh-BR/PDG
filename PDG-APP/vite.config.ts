import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  // Servido em https://eihpostech.com/PDG-DOM/
  base: "/PDG-DOM/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "lucide-react": path.resolve(
        __dirname,
        "./node_modules/lucide-react/dist/cjs/lucide-react.js",
      ),
    },
  },
  build: {
    outDir: "dist",
  },
});
