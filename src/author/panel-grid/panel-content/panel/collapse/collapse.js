import collapseCSS from './collapse.css' assert { type: 'css' };
import { A11yCollapse } from '@haxtheweb/a11y-collapse';

class Collapse extends A11yCollapse {

  static name = 'collapse'

  static get _styleSheet() {
    return collapseCSS;
  }
  get expanded () {
    const { items={}, ki } = this.elementState;
    return items[ki].expanded || false;
  }
  set expanded (v) {
    const { items={}, ki } = this.elementState;
    if (items && ki in items) {
      items[ki].expanded = v;
      this.requestUpdate();
    }
    return true;
  }
}

export { Collapse }
