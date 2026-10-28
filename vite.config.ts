/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative paths so the build works both locally and under /<repo>/ on GitHub Pages.
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
