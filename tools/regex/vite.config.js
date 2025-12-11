import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  base: '/regex/',
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  server: {
    port: 3001
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
  assetsInclude: ['**/*.wasm']
})
