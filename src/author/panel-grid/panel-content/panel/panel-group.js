import { Panel } from './panel';
import { PanelItemGroup } from './panel-item-group';
import { sourceGroupItems } from '../../../../items/source-group-items'

class PanelGroup extends sourceGroupItems(Panel) {

  static name = 'panel-group'
  static itemElement = PanelItemGroup

}

export { PanelGroup }
