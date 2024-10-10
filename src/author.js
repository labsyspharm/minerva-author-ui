import globalCSS from './global.css' assert { type: 'css' };
import { toElementState } from './lib/elements.js';
import { Author } from './author/author.js';
import { nav_config } from './config/nav-config.js';
import { item_registry } from './config/metadata-config';

const author = (options={}) => {
  document.adoptedStyleSheets = [
    globalCSS
  ];
  const customSuffix = options.ID || crypto.randomUUID();
  const defineElement = toElementState(customSuffix, {
    defaults: {
    },
    constants: {
      item_registry: {
        ...item_registry,
        ...(options.ItemRegistry || {})
      },
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
