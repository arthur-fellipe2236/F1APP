import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === "true",
      interval: 300,
    },
    proxy: {
      "/api": {
        target:
          process.env.API_PROXY_TARGET ||
          process.env.VITE_API_URL ||
          "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
