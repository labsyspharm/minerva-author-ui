import { MDEditor } from '../../../../../md-editor/md-editor'
import { PanelItem } from '../../../../../panel-content/panel/panel-item'
import { sourceStoryItems } from '../../../../../../../items/source-story-items'
import { useItemSelection } from '../../../../../../../filters/use-item-selection'

class MDEditorStory extends useItemSelection(
    sourceStoryItems(MDEditor), PanelItem.name
) {
  static name = 'md-editor-story'
}

export { MDEditorStory }
