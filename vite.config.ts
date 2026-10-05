import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages under /rabbit-game/.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
  },
});
