import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use relative base path so the app deploys cleanly to GitHub Pages (/rehab/) or root domains
export default defineConfig({
  base: './',
  plugins: [react()],
});
