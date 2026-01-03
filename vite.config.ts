import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@wllama/wllama/src/multi-thread/wllama.wasm',
          dest: 'wllama',
          rename: 'wllama.wasm',
        },
        {
          src: 'node_modules/@wllama/wllama/src/single-thread/wllama.wasm',
          dest: 'wllama',
          rename: 'wllama-single.wasm',
        },
      ],
    }),
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    target: 'esnext', // wllama/wasm often needs modern target
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
});
