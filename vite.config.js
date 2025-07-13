import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      input: {
        client: resolve(__dirname, 'src/client/main.js'),
        worker: resolve(__dirname, 'src/index.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'client' ? 'assets/[name]-[hash].js' : '[name].js';
        }
      }
    }
  }
}); 