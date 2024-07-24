import { TextField } from '../../../../../text-field/text-field'

class TextFieldStory extends TextField {
  static name = 'text-field-story'

  get allContentOptions() {
    const { metadata_config } = this.elementState;
    return metadata_config.stories;
  }

  get contentOption() {
    const { allContentOptions } = this;
    const { selections } = this.elementState;
    const { waypoint_key } = selections.find(x => {
      return x.dialog == 'STORY-DIALOG';
    }) || { };
    return allContentOptions.find(x => {
      return x.key == waypoint_key
    }) || null;
  }

  get value() {
    const { contentOption: waypoint } = this;
    return waypoint?.title || '';
  }

  set value(v) {
    const { contentOption: waypoint } = this;
    waypoint.title = v;
  }
}

export { TextFieldStory }
