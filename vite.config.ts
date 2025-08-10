import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/test-bet-uxui/", // <--- IMPORTANT: Replace 'test-bet-uxui' with your repository name

  // Enable source maps for debugging
  css: {
    devSourcemap: true,
  },

  // Development server configuration
  server: {
    host: "localhost",
    port: 5173,
    open: false, // Don't auto-open browser to allow debugger to control it
    cors: true,
    sourcemapIgnoreList: (sourcePath) => {
      return sourcePath.includes("node_modules");
    },
  },

  // Build configuration with source maps
  build: {
    sourcemap: true,
    minify: false, // Disable minification in development builds for better debugging
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false,
      },
    },
  },

  // Ensure proper resolution for debugging
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },

  // Optimize deps for better debugging experience
  optimizeDeps: {
    include: ["react", "react-dom", "antd"],
    force: false,
  },
});
