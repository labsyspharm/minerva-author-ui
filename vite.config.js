import { standardCssModules } from 'vite-plugin-standard-css-modules';
import { resolve } from 'path'

export default {
  base: '',
  plugins: [
      standardCssModules(),
  ],
  optimizeDeps: {
    exclude: [ "@haxtheweb/simple-icon" ]
  },
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      //external: '/public/.*',
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
}
