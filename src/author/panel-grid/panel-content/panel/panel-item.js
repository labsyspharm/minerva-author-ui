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
    ['ki', { type: Number }]
  ])

  get itemSources () {
    return []; // Defined in derived classes
  }

  get elementTemplate() {
    const { ki, tab, nav_config } = this.elementState;
    const items = this.itemSources;
    const n_items = items.length;
    const { UUID } = items[ki];
    const actions = nav_config[tab].actions || [];
    const { collapseElement } = this.constructor; 
    const collapse = this.defineElement(collapseElement, {
      defaults: { ki: '' },
    });
    const item_contents = () => {
      return this.itemContents;
    }
    const content_action = (action => {
      if (action == null) {
        return '';
      }
      const next_config = nav_config[action.next];
      const button = toElement('button')``({
        '@click': () => {
          if (next_config.dialog) {
            this.elementState.dialog = action.next;
            switch (next_config.id) {
              case 'STORY-DIALOG':
                this.elementState.selections = [{
                  dialog: next_config.id,
                  waypoint_key: UUID
                }]
                break;
              case 'GROUP-DIALOG':
                this.elementState.selections = [{
                  dialog: next_config.id,
                  group_key: UUID
                }]
                break;
            }
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
      accordion: true, ki,
      expanded: '',
      class: () => {
        if (ki+1 == n_items) {
          return 'end';
        }
        return ''
      }
    });
  }

  get itemHeading() {
    const { ki } = this.elementState;
    const items = this.itemSources;
    const item = items[ki];
    return item?.Properties.Name
  }

  get itemContents() {
    const { ki, items } = this.elementState;
    return items[ki].content.split('\n').map(text => {
      return toElement('p')`${() => text}`({});
    });
  }
}

export { PanelItem }
