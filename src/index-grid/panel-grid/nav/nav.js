import navCSS from '#nav-css' assert { type: 'css' };
import { toElement } from '#elements';

class Nav extends HTMLElement {

  get elementTemplate() {
    const {
      menu_order, tab_order,
    } = this.elementState;
    const menu_items = this.itemsTemplate(
      menu_order, 'button'
    );
    const tab_items = this.itemsTemplate(
      tab_order, 'tab'
    );
    return toElement('div')`
      <div class="stretch grid menu">
        ${() => menu_items}
      </div>
      <div class="stretch grid menu tabs">
        ${() => tab_items}
      </div>
    `({
      'class': 'contents'
    });
  }
  itemsTemplate(item_list, role) {
    const { nav_config } = this.elementState;
    return item_list.map((item_id, i) => {
      const item = nav_config.get(item_id);
      const item_class = () => {
        return `center grid menu ${role}`;
      }
      return toElement('div')`
      <button class="${item_class}" role="${role}">
        <span>${() => item.heading}</span>
      </button>`({
        'class': 'stretch grid menu',
        'chosen': () => {
          const { tab, dialog } = this.elementState;
          return [tab, dialog].includes(item.id);
        },
        '@click': () => {
          const { nav_config } = this.elementState;
          if ('dialog' in nav_config.get(item.id)) {
            this.elementState.dialog = item.id;
          }
          else if (role == 'tab') {
            this.elementState.tab = item.id;
          }
          else {
            this.elementState.notice = item.id;
          }
        },
      });
    })
  }

  static get _styleSheet() {
    return navCSS;
  }
}

export { Nav };
