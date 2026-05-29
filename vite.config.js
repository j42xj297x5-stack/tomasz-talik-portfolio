import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/tomasz-talik-portfolio/',
  resolve: {
    alias: {
      three: fileURLToPath(new URL('./vendor/three/three.module.js', import.meta.url)),
    },
  },
});
