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
    const { ki } = this.elementState;
    return (
      this.constructor.is_expanded_item(items[ki])
    );
  }

  set expanded (v) {
    const { ki } = this.elementState;
    const items = this.itemSources;
    if (items && ki in items) {
      items[ki].State.Expanded = v;
      this.requestUpdate();
    }
    return true;
  }
}

export { Collapse }
