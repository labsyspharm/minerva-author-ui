import { TextField } from '../../../text-field/text-field'
import { MDEditor } from '../../../panel-grid/md-editor/md-editor';
import { sourceHyperlinkItems } from '../../../../items/source-hyperlink-items'

class TextFieldLink extends sourceHyperlinkItems(
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
