import { defineConfig, ConfigEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }: ConfigEnv) => ({
  server: {
    host: true,
    port: 8080,
    strictPort: true,
    hmr: {
      clientPort: 8080,
      protocol: 'ws',
      host: 'localhost',
      timeout: 120000,
      overlay: true,
    },
    https: {
      cert: '',  // path to cert if needed
      key: '',   // path to key if needed
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));