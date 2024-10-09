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
    },
    constants: {
      metadata_config,
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
      ),
      dialog_notices: {
        'EXPORT-DIALOG': 'EXPORT-NOTICE',
        'SAVEAS-DIALOG': 'SAVEAS-NOTICE',
      },
      tab_dialogs: {
        'STORY-PANEL': 'STORY-DIALOG',
        'GROUP-PANEL': 'GROUP-DIALOG',
      }
    },
    styleSheet: globalCSS
  });
  return defineElement(Author, {
    defaults: {
      notice: '', dialog: '', tab: 'GROUP-PANEL',
      selections: []
    }
  });
}

export { author } 
