import { TextField } from '../../../../../../text-field/text-field';
import { PanelItem } from '../../../../../panel-content/panel/panel-item'
import { sourceStoryItems } from '../../../../../../../items/source-story-items'
import { useItemSelection } from '../../../../../../../filters/use-item-selection'

class TextFieldStory extends useItemSelection(
    PanelItem.name, sourceStoryItems(TextField)
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
