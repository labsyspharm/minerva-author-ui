import { toElement } from '../../../../lib/elements';
import panelCSS from './panel.css' assert { type: 'css' };
import { PanelItem } from './panel-item';

class Panel extends HTMLElement {

  static name = 'panel'
  static itemElement = PanelItem 

  static get _styleSheet() {
    return panelCSS;
  }

  get elementTemplate() {
    const item = this.constructor.itemElement; 
    const panel_item = this.defineElement(item, {
      defaults: { UUID: '' }
    });
    return this.itemSources.map(item => {
      return toElement(panel_item)``({
        UUID: item.UUID, class: 'contents'
      }).key(item.UUID);
    });
  }

}

export { Panel }
