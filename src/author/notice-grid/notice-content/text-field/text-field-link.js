import { TextField } from '../../../text-field/text-field'
import { MDEditor } from '../../../panel-grid/md-editor/md-editor';
import { sourceURLSelection } from '../../../../config/source-url-selection'

class TextFieldLink extends sourceURLSelection(
  TextField, MDEditor.name
) {
  static name = 'text-field-link'

  get value() {
    const { itemSource } = this;
    return itemSource?.url || '';
  }

  set value(v) {
    const { itemSource } = this;
    itemSource.url = v;
  }
}

export { TextFieldLink }
