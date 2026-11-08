import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// maplibre-gl's package exports don't expose its dist files, which we need for the
// CSS and the web worker (see src/components/map/maplibre.ts). The "~" prefix keeps
// Vite from treating it as a package to pre-bundle in dev.
const maplibreDist = decodeURIComponent(
  new URL("./node_modules/maplibre-gl/dist", import.meta.url).pathname
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "~maplibre-gl-dist": maplibreDist },
  },
  server: {
    port: 5173,
    proxy: {
      "/graphql": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/upload": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
