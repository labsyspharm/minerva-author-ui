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

  get itemSources () {
    return []; // Defined in derived classes
  }

  get expanded () {
    const { ki } = this.elementState;
    const items = this.itemSources;
    return items[ki]?.State.Expanded || false;
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
