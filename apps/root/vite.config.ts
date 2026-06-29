import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

export default defineConfig({
  base: "/",
  server: {
    allowedHosts: ["proud-owls-change.loca.lt"],
    hmr: { overlay: false },
    proxy: {
      "/r": "http://localhost:8081",
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    visualizer(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "inline",
      workbox: {
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  build: {
    sourcemap: "hidden",
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "motion",
              test: /node_modules\/(motion-dom|motion|framer-motion)/,
              priority: 50,
            },
            {
              name: "vendor-react",
              test: /node_modules\/(react|react-dom|scheduler)/,
              priority: 40,
            },
            {
              name: "vendor-router",
              test: /node_modules\/(react-router|@remix-run)/,
              priority: 30,
            },
            {
              name: "vendor-query",
              test: /node_modules\/@tanstack/,
              priority: 25,
            },
            {
              name: "vendor-ui",
              test: /node_modules\/(@base-ui-components|floating-ui|lucide-react)/,
              priority: 20,
            },
            {
              name: "vendor",
              test: /node_modules/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
