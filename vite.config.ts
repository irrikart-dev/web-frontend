import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Catalogue images and brand assets are served by the API from /static.
    proxy: {
      '/static': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
