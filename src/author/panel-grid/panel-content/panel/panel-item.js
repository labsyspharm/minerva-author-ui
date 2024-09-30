import panelItemCSS from './panel-item.css' assert { type: 'css' };
import { useItemIdentifier } from '../../../../filters/use-item-identifier';
import { toElement } from '../../../../lib/elements';
import { Collapse } from './collapse/collapse';

class PanelItem extends useItemIdentifier(HTMLElement) {

  static name = 'panel-item'
  static collapseElement = Collapse

  static get _styleSheet() {
    return panelItemCSS;
  }

  get elementTemplate() {
    const { collapseElement } = this.constructor; 
    const collapse = this.defineElement(collapseElement, {
      defaults: { UUID: '', expanded: true },
      attributes: [ 'expanded' ]
    });
    const item_contents = () => {
      return this.itemContents;
    }
    const content_action = () => {
      const { tab, nav_config } = this.elementState;
      const actions = nav_config[tab].actions || [];
      const action = actions.find(
        ({ slot }) => slot == 'content'
      );
      if (action == null) {
        return '';
      }
      const button = toElement('button')``({
        '@click': () => {
          const { tab, tab_dialogs } = this.elementState;
          const { UUID } = this.itemSource;
          const dialog = tab_dialogs[tab];
          if (dialog) {
            this.elementState.dialog = dialog;
            this.elementState.selections = [{
              origin: PanelItem.name, UUID
            }]
          }
        },
        class: 'button',
        type: 'submit'
      })
      return toElement('div')`${button}`({
        class: 'full actions'
      });
    };
    return toElement(collapse)`
      <div class="grid" slot="heading">
        ${() => this.itemHeading}
      </div>
      <div slot="content">
        <div class="full text">
          ${item_contents}
        </div>
          ${content_action}
      </div>
    `({
      expanded: String(
        this.itemSource.State.Expanded
      ),
      accordion: 'true',
      UUID: (
        this.elementState.UUID
      ),
      class: () => {
        const item = this.itemSource;
        const items = this.itemSources;
        const last_item = [...items].pop();
        if (last_item.UUID == item.UUID) {
          return 'end';
        }
        return ''
      }
    });
  }

  get itemHeading() {
    const item = this.itemSource;
    return item?.Properties.Name
  }
}

export { PanelItem }
