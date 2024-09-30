import { MDEditor } from '../../../md-editor/md-editor'
import { useItemIdentifier } from '../../../../../filters/use-item-identifier';
import { sourceStoryItems } from '../../../../../items/source-story-items'

class MDViewerStory extends sourceStoryItems(
  useItemIdentifier(MDEditor)
) {
  static name = 'md-viewer-story'

  static elementProperties = new Map([
    ...MDEditor.elementProperties
  ])

  attributeChangedCallback(k, old_v, v) {
    if (k == 'dialog' && v == '') {
      this.updateEditorContent(
        this.contentValue
      )
    }
  }
}

export { MDViewerStory }
