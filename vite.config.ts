import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: { host: true },
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "Waldas Watch",
        short_name: "Waldas Watch",
        description: "Budget tracking app",
        theme_color: "#0F766E",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        // Add 192x192 and 512x512 PNG icons to public/pwa-icons/ before deploying
        icons: [
          {
            src: "pwa-icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
