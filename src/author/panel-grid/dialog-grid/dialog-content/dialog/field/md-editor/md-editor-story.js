import { MDEditor } from '../../../../../md-editor/md-editor'
import { PanelItem } from '../../../../../panel-content/panel/panel-item'
import { sourceStoryItems } from '../../../../../../../config/source-story-items'
import { sourceItemSelection } from '../../../../../../../config/source-item-selection'

class MDEditorStory extends sourceItemSelection(
    sourceStoryItems(MDEditor), PanelItem.name
) {
  static name = 'md-editor-story'
}

export { MDEditorStory }
