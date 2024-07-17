import { standardCssModules } from 'vite-plugin-standard-css-modules';
import { resolve } from 'path'

export default {
  plugins: [
      standardCssModules(),
  ],
  optimizeDeps: {
    exclude: [ "@haxtheweb/simple-icon" ]
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'MinervaAuthorUI',
      fileName: 'bundle',
      format: 'es'
    },
  }
}
