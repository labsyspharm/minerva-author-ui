import { standardCssModules } from 'vite-plugin-standard-css-modules';
import mkcert from 'vite-plugin-mkcert'
import { resolve } from 'path'

export default {
  base: '',
  server: { https: true },
  plugins: [
    mkcert(), 
    standardCssModules()
  ],
  optimizeDeps: {
    exclude: [ "@haxtheweb/simple-icon" ]
  },
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      preserveEntrySignatures: "allow-extension",
      input: {
        'author': resolve(__dirname, 'src/author.js'),
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
}
