import {cssModules} from 'rollup-plugin-css-modules';
import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default {
  input: 'src/index.js',
  output: {
    file: 'bundle.js',
    format: 'es'
  },
  plugins: [
    resolve(),
    cssModules(),
    alias({
      entries: [
        { find: '#global-css', replacement: path.resolve(__dirname, './src/global.css') },
        { find: '#form-css', replacement: path.resolve(__dirname, './src/form/form.css') },
        { find: '#field-css', replacement: path.resolve(__dirname, './src/field/field.css') },
        { find: '#index-grid-css', replacement: path.resolve(__dirname, './src/index-grid/index-grid.css') },
        { find: '#panel-grid-css', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/panel-grid.css') },
        { find: '#icon-button-css', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/icon-button.css') },
        { find: '#panel-content-css', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/panel-content/panel-content.css') },
        { find: '#collapse-css', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/panel-content/collapse.css') },
        { find: '#styled-notice-css', replacement: path.resolve(__dirname, './src/index-grid/notice-grid/styled-notice/styled-notice.css') },
        { find: '#styled-dialog-css', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/dialog-grid/styled-dialog/styled-dialog.css') },
        { find: '#dialog-content-css', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/dialog-grid/dialog-content/dialog-content.css') },
        { find: '#notice-content-css', replacement: path.resolve(__dirname, './src/index-grid/notice-grid/notice-content/notice-content.css') },
        { find: '#nav-css', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/nav/nav.css') },
        { find: 'index', replacement: path.resolve(__dirname, './src/index.js') },
        { find: '#form', replacement: path.resolve(__dirname, './src/form/form.js') },
        { find: '#field', replacement: path.resolve(__dirname, './src/field/field.js') },
        { find: '#elements', replacement: path.resolve(__dirname, './src/lib/elements.js') },
        { find: '#element-state', replacement: path.resolve(__dirname, './src/lib/element-state.js') },
        { find: '#element-template', replacement: path.resolve(__dirname, './src/lib/element-template.js') },
        { find: '#nav-config', replacement: path.resolve(__dirname, './src/config/nav-config.js') },
        { find: '#metadata-config', replacement: path.resolve(__dirname, './src/config/metadata-config.js') },
        { find: '#index-grid', replacement: path.resolve(__dirname, './src/index-grid/index-grid.js') },
        { find: '#nav', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/nav/nav.js') },
        { find: '#styled-notice', replacement: path.resolve(__dirname, './src/index-grid/notice-grid/styled-notice/styled-notice.js') },
        { find: '#styled-dialog', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/dialog-grid/styled-dialog/styled-dialog.js') },
        { find: '#dialog-content', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/dialog-grid/dialog-content/dialog-content.js') },
        { find: '#notice-content', replacement: path.resolve(__dirname, './src/index-grid/notice-grid/notice-content/notice-content.js') },
        { find: '#panel-content', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/panel-content/panel-content.js') },
        { find: '#panel-grid', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/panel-grid.js') },
        { find: '#icon-button', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/icon-button.js') },
        { find: '#dialog-grid', replacement: path.resolve(__dirname, './src/index-grid/panel-grid/dialog-grid/dialog-grid.js') },
        { find: '#notice-grid', replacement: path.resolve(__dirname, './src/index-grid/notice-grid/notice-grid.js') }
      ]
    })
  ]
};
