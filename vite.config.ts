/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
    },
  },
  plugins: [
    react(),
    // Suporte a Androids/navegadores antigos: gera um bundle legado (ES5 +
    // polyfills via core-js) carregado por <script nomodule> em WebView/Chrome
    // que não roda módulos ES (ex.: Android 7–9). Sem isso, o JS moderno
    // (?., ??, etc.) dá erro de parse no boot e o app "nem abre".
    // modernPolyfills injeta os polyfills necessários também no bundle moderno,
    // ajudando aparelhos que rodam módulos mas não têm APIs recentes.
    legacy({
      targets: ["chrome >= 61", "safari >= 11", "firefox >= 60", "edge >= 18", "android >= 6"],
      modernPolyfills: true,
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
  build: {
    rollupOptions: {
      output: {
        // Separa dependências grandes em chunks próprios para reduzir o
        // bundle inicial e melhorar o cache entre deploys.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
