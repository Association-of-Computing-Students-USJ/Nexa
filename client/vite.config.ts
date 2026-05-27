import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          lenis: ["lenis"],
          firebase: ["firebase/app", "firebase/firestore", "firebase/auth"],
        },
      },
    },
  },
});

