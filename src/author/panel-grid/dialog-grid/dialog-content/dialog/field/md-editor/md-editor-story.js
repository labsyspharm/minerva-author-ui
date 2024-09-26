import { MDEditor } from '../../../../../md-editor/md-editor'
import { sourceStoryItems } from '../../../../../../../config/source-story-items'
import { sourceItemSelection } from '../../../../../../../config/source-item-selection'

class MDEditorStory extends sourceItemSelection(
    sourceStoryItems(MDEditor)
) {
  static name = 'md-editor-story'
}

export { MDEditorStory }
