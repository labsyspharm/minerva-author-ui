import panelItemCSS from './panel-item.css' assert { type: 'css' };
import { toElement } from '../../../../lib/elements';
import { Collapse } from './collapse/collapse';

class PanelItem extends HTMLElement {

  static name = 'panel-item'
  static collapseElement = Collapse

  static get _styleSheet() {
    return panelItemCSS;
  }

  static elementProperties = new Map([
    ['item_key', { type: Number }]
  ])

  get itemSources () {
    return []; // Defined in derived classes
  }

  get elementTemplate() {
    const { item_key, tab, nav_config } = this.elementState;
    const items = this.itemSources;
    const n_items = items.length;
    const actions = nav_config[tab].actions || [];
    const { collapseElement } = this.constructor; 
    const collapse = this.defineElement(collapseElement, {
      defaults: { item_key: '' },
    });
    const item_contents = () => {
      return this.itemContents;
    }
    const content_action = (action => {
      if (action == null) {
        return '';
      }
      const button = toElement('button')``({
        '@click': () => {
          const { tab, tab_dialogs } = this.elementState;
          const dialog = tab_dialogs[tab];
          const { UUID } = items[item_key];
          console.log(tab, dialog, item_key, UUID);
          if (dialog) {
            this.elementState.dialog = dialog;
            this.elementState.selections = [{
              origin: PanelItem.name, item_key: UUID
            }]
          }
        },
        class: 'button',
        type: 'submit'
      })
      return toElement('div')`${button}`({
        class: 'full actions'
      });
    })(actions.find(
      ({ slot }) => slot == 'content'
    ));
    return toElement(collapse)`
      <div class="grid" slot="heading">
        ${() => this.itemHeading}
      </div>
      <div slot="content">
        <div class="full text">
          ${item_contents}
        </div>
          ${() => content_action}
      </div>
    `({
      accordion: true, item_key,
      expanded: '',
      class: () => {
        if (item_key+1 == n_items) {
          return 'end';
        }
        return ''
      }
    });
  }

  get itemHeading() {
    const { item_key } = this.elementState;
    const items = this.itemSources;
    const item = items[item_key];
    return item?.Properties.Name
  }

  get itemContents() {
    const { item_key, items } = this.elementState;
    return items[item_key].content.split('\n').map(text => {
      return toElement('p')`${() => text}`({});
    });
  }
}

export { PanelItem }
