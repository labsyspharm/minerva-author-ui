import { toElement } from '../../../../lib/elements';
import { PanelItem } from './panel-item';

class Panel extends HTMLElement {

  static name = 'panel'
  static itemElement = PanelItem 

  get elementTemplate() {
    const { itemsTemplate } = this.elementContents;
    return itemsTemplate();
  }

  get elementContents() {
    const item = this.constructor.itemElement; 
    const panel_item = this.defineElement(item, {
      defaults: { ki: 0 }
    });
    const itemsTemplate = () => {
      const keys = this.allPanelKeys;
      return keys.map(ki => {
        return toElement(panel_item)``({
          ki, class: 'contents'
        });
      })
    }
    return { itemsTemplate };
  }

  get allPanelKeys () {
    return []
  }
}

export { Panel }
