import panelItemCSS from './panel-item.css' assert { type: 'css' };
import { toElement } from '../../../../lib/elements';
import { Collapse } from './collapse/collapse';

class PanelItem extends HTMLElement {

  static name = 'panel-item'

  static get _styleSheet() {
    return panelItemCSS;
  }

  static elementProperties = new Map([
    ['ki', { type: Number }]
  ])

  get elementTemplate() {
    const { ki, tab, nav_config } = this.elementState;
    const items = this.allPanelItems;
    const n_items = items.length;
    const item = items[ki];

    const actions = nav_config[tab].actions;
    const collapse = this.defineElement(Collapse, {
      constants: { items }, defaults: { ki: '' }
    });
    const item_title = () => {
      return item.title
    }
    const item_contents = () => {
      return this.itemContents;
    }
    const content_action = (({ id }) => {
      const next_config = nav_config[id];
      return toElement('button')``({
        '@click': () => {
          if (next_config.dialog) {
            this.elementState.dialog = id;
            switch (next_config.id) {
              case 'STORY-DIALOG':
                this.elementState.selections = [{
                  dialog: next_config.id,
                  waypoint_key: item.key
                }]
            }
          }
        },
        class: 'button',
        type: 'submit'
      })
    })(actions.find(
      ({ slot }) => slot == 'content'
    ));
    return toElement(collapse)`
      <p slot="heading">${item_title}</p>
      <div slot="content">
        <div class="full text">
          ${item_contents}
        </div>
        <div class="full actions">
          ${() => content_action}
        </div>
      </div>
    `({
      accordion: true, ki,
      expanded: () => {
        return item.expanded
      },
      class: () => {
        if (ki+1 == n_items) {
          return 'end';
        }
        return ''
      }
    });
  }

  get allPanelItems() {
    return [];
  }

  get itemContents() {
    const { ki } = this.elementState;
    const items = this.allPanelItems;
    return items[ki].content.split('\n').map(text => {
      return toElement('p')`${() => text}`({});
    });
  }
}

export { PanelItem }
