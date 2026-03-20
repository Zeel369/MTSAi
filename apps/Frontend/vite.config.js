import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const htmlEntries = Object.fromEntries(
  readdirSync('.').filter((file) => file.endsWith('.html')).map((file) => [file.replace(/\.html$/, ''), resolve(__dirname, file)])
);

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: htmlEntries
    }
  }
});
