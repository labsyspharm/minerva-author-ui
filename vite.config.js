import { standardCssModules } from 'vite-plugin-standard-css-modules';
import { resolve } from 'path'

export default {
  plugins: [
      standardCssModules(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'MinervaAuthorUI',
      fileName: 'bundle',
      format: 'es'
    },
  }
}
