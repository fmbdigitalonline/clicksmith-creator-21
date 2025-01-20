import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Listen on all addresses
    port: 8080,
    strictPort: true, // Don't try other ports if 8080 is taken
    hmr: {
      clientPort: 443, // Force client to use HTTPS port
      protocol: 'wss', // Use secure WebSocket
      host: '51d85d4a-57a5-4cf4-a478-7ea91ed58660.lovableproject.com' // Set the correct host
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));