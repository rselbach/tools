import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: '/regex/',
  plugins: [
    wasm(),
    topLevelAwait(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/re2-wasm/build/wasm/re2.wasm',
          dest: 'assets'
        }
      ]
    })
  ],
  server: {
    port: 3001
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  }
})
