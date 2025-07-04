import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/test-bet-uxui/", // <--- IMPORTANT: Replace 'test-bet-uxui' with your repository name
});
