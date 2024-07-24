import globalCSS from './global.css' assert { type: 'css' };
import { toElementState } from './lib/elements.js';
import { Author } from './author/author.js';
import { nav_config } from './config/nav-config.js';
import {
  metadata_config as metadata_config_defaults
} from './config/metadata-config';

const author = (customSuffix, options={}) => {
  document.adoptedStyleSheets = [
    globalCSS
  ];
  const metadata_config = {
    ...metadata_config_defaults,
    ...(options.config || {})
  }
  const defineElement = toElementState(customSuffix, {
    defaults: {
      content_map: 'content_map',
      metadata_config
    },
    constants: {
      nav_config,
      tab_order: (
        [ 
          'IMAGE-PANEL', 'OVERLAY-PANEL',
          'GROUP-PANEL', 'STORY-PANEL'
        ]
      ),
      menu_order: (
        [ 
          'EXPORT-DIALOG', 'SAVEAS-DIALOG',
          'SAVE-NOTICE'
        ]
      )
    },
    styleSheet: globalCSS
  });
  return defineElement(Author, {
    defaults: {
      notice: '', dialog: '', tab: 'STORY-PANEL',
      selections: []
    }
  });
}

export { author } 
