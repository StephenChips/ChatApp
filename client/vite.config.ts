import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { analyzer } from "vite-bundle-analyzer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), analyzer()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8080",
      "/default-avatars": "http://127.0.0.1:8080",
      "/userdata": "http://127.0.0.1:8080",
      "/socket.io": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
