
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './supplychaindemo/', // Ensures assets are loaded correctly on GitHub Pages
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
