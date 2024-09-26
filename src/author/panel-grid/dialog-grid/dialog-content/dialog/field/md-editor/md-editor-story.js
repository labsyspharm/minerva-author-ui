import { MDEditor } from '../../../../../md-editor/md-editor'
import { sourceStoryItems } from '../../../../../../../config/source-story-items'

class MDEditorStory extends sourceStoryItems(MDEditor) {
  static name = 'md-editor-story'

  get itemSource() {
    const { itemSources } = this;
    const { selections } = this.elementState;
    const { item_key } = selections.find(x => {
      return x.dialog == 'STORY-DIALOG';
    }) || { };
    return itemSources.find(x => {
      return x.UUID == item_key
    }) || null;
  }
}

export { MDEditorStory }
