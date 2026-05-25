import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** GitHub Pages project site: https://<user>.github.io/SchemaMakerOnline/ */
const GITHUB_PAGES_BASE = '/SchemaMakerOnline/';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'pages' ? GITHUB_PAGES_BASE : '/',
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          konva: ['konva', 'react-konva'],
          pdf: ['jspdf'],
        },
      },
    },
  },
}));
