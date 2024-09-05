import { PanelItem } from './panel-item';
import { MDViewerStory } from './md-viewer/md-viewer-story';
import { toElement } from '../../../../lib/elements'
import { sourceStoryItems } from '../../../../config/source-story-items'
import { CollapseStory } from './collapse/collapse-story';

class PanelItemStory extends sourceStoryItems(PanelItem) {

  static name = 'panel-item-story'
  static collapseElement = CollapseStory

  get itemContents() {
    const { ki } = this.elementState;
    const mdViewerStory = this.defineElement(MDViewerStory, {
      defaults: {
        property: '', ki: '', editable: false
      },
      attributes: [ 'dialog' ]
    });
    return toElement(mdViewerStory)``({ 
      ki, property: 'Content', editable: false,
      dialog: () => this.elementState.dialog
    });
  }
}

export { PanelItemStory }
