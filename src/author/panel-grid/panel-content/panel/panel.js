import { toElement } from '../../../../lib/elements';
import panelCSS from './panel.css' assert { type: 'css' };
import { PanelItem } from './panel-item';

class Panel extends HTMLElement {

  static name = 'panel'
  static itemElement = PanelItem 

  static get _styleSheet() {
    return panelCSS;
  }

  static elementProperties = new Map([
    ['item_key', { type: Number }]
  ])

  get itemSources () {
    return []; // Defined in derived classes
  }

  get itemKeys () {
    return [
      ...Object.keys(this.itemSources)
    ];
  }

  get elementTemplate() {
    const item = this.constructor.itemElement; 
    const panel_item = this.defineElement(item, {
      defaults: { item_key: 0 }
    });
    return this.itemKeys.map(item_key => {
      return toElement(panel_item)``({
        item_key, class: 'contents'
      });
    })
  }

}

export { Panel }
