import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
  },
  plugins: [
    react(),
    tailwindcss()
  ],
});
