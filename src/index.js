import globalCSS from '#global-css' assert { type: 'css' };
import { toElement, toElementState } from '#elements';
import { IndexGrid } from '#index-grid';
import { nav_config } from '#nav-config';
import { metadata_config } from '#metadata-config';

const indexgrid = async (customSuffix, options={}) => {
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
  return defineElement(IndexGrid, {
    defaults: {
      notice: '', dialog: '', tab: 'STORY'
    }
  });
}

export default indexgrid
