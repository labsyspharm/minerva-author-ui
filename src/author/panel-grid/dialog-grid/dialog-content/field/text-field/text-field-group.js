import { TextField } from '../../../../../text-field/text-field'

class TextFieldGroup extends TextField {
  static name = 'text-field-group'

  get allContentOptions() {
    const { metadata_config } = this.elementState;
    return metadata_config.Groups;
  }

  get contentOption() {
    const { allContentOptions } = this;
    const { selections } = this.elementState;
    const { group_key } = selections.find(x => {
      return x.dialog == 'GROUP-DIALOG';
    }) || { };
    return allContentOptions.find(x => {
      return x.UUID == group_key
    }) || null;
  }

  get value() {
    const { contentOption: group } = this;
    const { property } = this.elementState;
    return group?.Properties[property] || '';
  }

  set value(v) {
    const { contentOption: group } = this;
    const { property } = this.elementState;
    group.Properties[property] = v;
  }
}

export { TextFieldGroup }
