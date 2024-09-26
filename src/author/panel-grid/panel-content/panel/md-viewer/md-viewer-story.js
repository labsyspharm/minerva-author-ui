import { MDEditor } from '../../../md-editor/md-editor'
import { sourceStoryItems } from '../../../../../config/source-story-items'

class MDViewerStory extends sourceStoryItems(MDEditor) {
  static name = 'md-viewer-story'

  static elementProperties = new Map([
    ...MDEditor.elementProperties,
    ['item_key', { type: Number }]
  ])

  get itemSource() {
    const { itemSources } = this;
    const { item_key } = this.elementState;
    return itemSources[item_key] || null;
  }

  attributeChangedCallback(k, old_v, v) {
    if (k == 'dialog' && v == '') {
      this.updateEditorContent(
        this.contentValue
      )
    }
  }
}

export { MDViewerStory }
