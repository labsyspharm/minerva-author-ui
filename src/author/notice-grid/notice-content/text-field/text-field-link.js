import { TextField } from '../../../text-field/text-field'
import { MDEditor } from '../../../panel-grid/md-editor/md-editor';
import { sourceHyperlinkItems } from '../../../../items/source-hyperlink-items'
import { useItemSelection } from '../../../../filters/use-item-selection'

class TextFieldLink extends useItemSelection(
  MDEditor.name, sourceHyperlinkItems(TextField)
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
