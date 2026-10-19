import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));
const sharedNodeModules = fileURLToPath(new URL('../node_modules', import.meta.url));

export default defineConfig({
  server: {
    fs: {
      allow: [frontendRoot, sharedNodeModules],
    },
  },
});
