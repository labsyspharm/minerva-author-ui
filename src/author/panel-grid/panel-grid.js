import panelGridCSS from './panel-grid.css' assert { type: 'css' };
import { PanelContentOverlay } from './panel-content/panel-content-overlay';
import { PanelContentGroup } from './panel-content/panel-content-group';
import { PanelContentStory } from './panel-content/panel-content-story';
import { PanelContent } from './panel-content/panel-content';
import { DialogGrid } from './dialog-grid/dialog-grid';
import { IconButton } from './icon-button';
import { toElement } from '../../lib/elements';
import { Nav } from './nav/nav';

class PanelGrid extends HTMLElement {

  static name = 'panel-grid'

  static getPropertyOptions(k) {
    if (k === 'expanded') {
      return { reflect: true }
    }
    return {}
  }

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
    const choose_content = (tab) => {
      return {
        'OVERLAY-PANEL': PanelContentOverlay,
        'STORY-PANEL': PanelContentStory,
        'GROUP-PANEL': PanelContentGroup
      }[tab] || PanelContent; 
    }
    const panel_content = () => {
      const panel = this.defineElement(
        choose_content(this.elementState.tab), {
          defaults: { items: [] }
        }
      );
      return toElement(panel)`
        <slot slot="overlays" name="overlays"></slot>
      `({
        class: 'stretch panel grid inner'
      })
    }
    const dialog = this.defineElement(DialogGrid);
    return toElement('div')`
      <${nav} class="contents"></${nav}>
      ${panel_content}
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
