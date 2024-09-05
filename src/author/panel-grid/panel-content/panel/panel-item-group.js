import { PanelItem } from './panel-item';
import { toElement } from '../../../../lib/elements'
import { RangeEditorGroup } from './range-editor/range-editor-group'
import { sourceGroupItems } from '../../../../config/source-group-items'
import { CollapseGroup } from './collapse/collapse-group';

class PanelItemGroup extends sourceGroupItems(PanelItem) {

  static name = 'panel-item-group'
  static collapseElement = CollapseGroup

  get itemContents() {
    const { ki } = this.elementState;
    const rangeEditorElement = this.defineElement(
      RangeEditorGroup, {
        defaults: { ki: '' },
        attributes: [ 'dialog' ]
      }
    );
    const rangeEditor = toElement(rangeEditorElement)``();
    return toElement('div')`${rangeEditor}`({ 
      ki, dialog: () => this.elementState.dialog,
      expanded: () => this.elementState.expanded
    });
  }

}

export { PanelItemGroup }
