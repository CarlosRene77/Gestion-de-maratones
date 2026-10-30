import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules[\\/]xlsx[\\/]/.test(id)) return 'vendor-xlsx';
          if (/node_modules[\\/](jspdf|html2canvas|canvg|dompurify)[\\/]/.test(id)) {
            return 'vendor-pdf';
          }
          if (/node_modules[\\/](html5-qrcode|qrcode)[\\/]/.test(id)) return 'vendor-qr';
          if (/node_modules[\\/](recharts|d3-[^\\/]+)[\\/]/.test(id)) return 'vendor-charts';
          return undefined;
        },
      },
    },
  },
});
