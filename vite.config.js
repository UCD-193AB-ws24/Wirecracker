import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import configDev from "./config.dev.json" with { type: 'json' };
import configProd from "./config.prod.json" with { type: 'json' };

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss()
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
  define: {
    __APP_CONFIG__: mode === 'development' ? configDev : configProd
  },
  server: mode === 'development' ? {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: configDev.backendURL, // Docker service name
        changeOrigin: true
      }
    }
  } : {}
}));
