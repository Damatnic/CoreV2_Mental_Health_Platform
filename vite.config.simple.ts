import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Simple Vite configuration for testing
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});