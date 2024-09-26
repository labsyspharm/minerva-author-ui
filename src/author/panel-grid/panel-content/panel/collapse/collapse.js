import collapseCSS from './collapse.css' assert { type: 'css' };
import { A11yCollapse } from '@haxtheweb/a11y-collapse';

class Collapse extends A11yCollapse {

  static name = 'collapse'

  static elementProperties = new Map([
    ...A11yCollapse.elementProperties
  ])

  static get _styleSheet() {
    return collapseCSS;
  }

  static is_expanded_item(item) {
    return item?.State.Expanded || false;
  }

  get itemSources () {
    return []; // Defined in derived classes
  }

  get expanded () {
    const items = this.itemSources;
    const { item_key } = this.elementState;
    return (
      this.constructor.is_expanded_item(items[item_key])
    );
  }

  set expanded (v) {
    const { item_key } = this.elementState;
    const items = this.itemSources;
    if (items && item_key in items) {
      items[item_key].State.Expanded = v;
      this.requestUpdate();
    }
    return true;
  }
}

export { Collapse }
