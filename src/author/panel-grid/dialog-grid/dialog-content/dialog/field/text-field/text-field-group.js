import { TextField } from '../../../../../../text-field/text-field'
import { sourceGroupItems } from '../../../../../../../config/source-group-items'
import { sourceItemSelection } from '../../../../../../../config/source-item-selection'

class TextFieldGroup extends sourceItemSelection(
    sourceGroupItems(TextField)
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
