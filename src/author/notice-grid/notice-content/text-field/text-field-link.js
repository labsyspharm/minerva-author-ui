import { TextField } from '../../../text-field/text-field'

class TextFieldLink extends TextField {
  static name = 'text-field-link'

  get contentOption() {
    const { selections } = this.elementState;
    const selected = selections.find(x => {
      return x.notice == 'LINK-NOTICE';
    }) || { };
    return selected || null;
  }

  get value() {
    const { contentOption: selected } = this;
    return selected?.url || '';
  }

  set value(v) {
    const { contentOption: selected } = this;
    selected.url = v;
  }
}

export { TextFieldLink }
