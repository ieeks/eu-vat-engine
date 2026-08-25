import { defineConfig } from 'vite';

export default defineConfig({
  // Relative assets work locally, in GitHub project Pages and behind an internal reverse proxy.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
