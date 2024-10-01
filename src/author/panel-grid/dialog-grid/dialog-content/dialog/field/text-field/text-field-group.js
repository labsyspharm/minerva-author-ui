import { TextField } from '../../../../../../text-field/text-field'
import { PanelItem } from '../../../../../panel-content/panel/panel-item'
import { sourceGroupItems } from '../../../../../../../items/source-group-items'
import { useItemSelection } from '../../../../../../../filters/use-item-selection'

class TextFieldGroup extends useItemSelection(
    PanelItem.name, sourceGroupItems(TextField)
) {
  static name = 'text-field-group'

  get value() {
    const { itemSource: group } = this;
    const { property } = this.elementState;
    return group?.Properties[property] || '';
  }

  set value(v) {
    const { itemSource: group } = this;
    const { property } = this.elementState;
    group.Properties[property] = v;
  }
}

export { TextFieldGroup }
