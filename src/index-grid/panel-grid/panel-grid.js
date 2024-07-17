import panelGridCSS from './panel-grid.css' assert { type: 'css' };
import { PanelContent } from './panel-content/panel-content';
import { DialogGrid } from './dialog-grid/dialog-grid';
import { IconButton } from './icon-button';
import { toElement } from '../../lib/elements';
import { Nav } from './nav/nav';

class PanelGrid extends HTMLElement {

  get iconTemplate() {
    const button = this.defineElement(IconButton);
    return toElement(button)``({
      class: 'icon',
      icon: () => {
        const { dialog } = this.elementState;
        if (dialog != '') {
          return 'icons:close';
        }
        return 'icons:expand-more';
      },
      '@click': (event) => {
        const { dialog } = this.elementState;
        if (dialog != '') {
          this.elementState.dialog = '';
          return;
        }
        this.elementState.expanded = (
          !this.elementState.expanded
        );
      },
      close: () => this.elementState.dialog != '',
      expanded: () => this.elementState.expanded
    })
  }
  get elementTemplate() {
    const nav = this.defineElement(Nav);
    const panel = this.defineElement(PanelContent);
    const dialog = this.defineElement(DialogGrid);
    return toElement('div')`
      <${nav} class="contents"></${nav}>
      <${panel} class="stretch panel grid inner"></${panel}>
      <${dialog} class="dialog" open="${
        () => this.elementState.dialog != ''
      }"></${dialog}>
      ${this.iconTemplate}
    `({
      'class': 'wrapper start grid',
      'expanded': () => this.elementState.expanded
    });
  }

  static get _styleSheet() {
    return panelGridCSS;
  }
}

export { PanelGrid };
