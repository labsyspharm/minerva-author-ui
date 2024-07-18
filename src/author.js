import globalCSS from './global.css' assert { type: 'css' };
import { toElement, toElementState } from './lib/elements.js';
import { Author } from './author/author.js';
import { nav_config } from './config/nav-config.js';
import { metadata_config } from './config/metadata-config';

const author = (customSuffix, options={}) => {
  document.adoptedStyleSheets = [
    globalCSS
  ];
  const defineElement = toElementState(customSuffix, {
    defaults: {
      content_map: 'content_map',
      metadata_config
    },
    constants: {
      nav_config,
      tab_order: (
        [ 'IMAGE', 'OVERLAY', 'GROUP', 'STORY' ]
      ),
      menu_order: (
        [ 'EXPORT', 'SAVEAS', 'SAVE' ]
      )
    },
    styleSheet: globalCSS
  });
  return defineElement(Author, {
    defaults: {
      notice: '', dialog: '', tab: 'STORY'
    }
  });
}

export { author } 
