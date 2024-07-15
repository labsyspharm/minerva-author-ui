import globalCSS from '#global-css' assert { type: 'css' };
import { toElement, toElementState } from '#elements';
import { IndexGrid } from '#index-grid';
import { nav_config } from '#nav-config';
import { metadata_config } from '#metadata-config';

const main = async (customSuffix) => {
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
  const index = defineElement(IndexGrid, {
    defaults: {
      notice: '', dialog: '', tab: 'STORY'
    }
  });
  toElement(index)``({
    class: 'contents'
  })(document.body);
}

export default main
