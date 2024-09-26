import { TextField } from '../../../../../../text-field/text-field';
import { sourceStoryItems } from '../../../../../../../config/source-story-items'
import { sourceItemSelection } from '../../../../../../../config/source-item-selection'

class TextFieldStory extends sourceItemSelection(
    sourceStoryItems(TextField)
) {
  static name = 'text-field-story'

  get allContentOptions() {
    const { metadata_config } = this.elementState;
    return metadata_config.Stories;
  }

  get value() {
    const { itemSource: waypoint } = this;
    const { property } = this.elementState;
    return waypoint?.Properties[property] || '';
  }

  set value(v) {
    const { itemSource: waypoint } = this;
    const { property } = this.elementState;
    waypoint.Properties[property] = v;
  }
}

export { TextFieldStory }
