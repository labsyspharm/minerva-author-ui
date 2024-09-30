import { PanelItem } from './panel-item';
import { MDViewerStory } from './md-viewer/md-viewer-story';
import { toElement } from '../../../../lib/elements'
import { sourceStoryItems } from '../../../../items/source-story-items'
import { CollapseStory } from './collapse/collapse-story';

class PanelItemStory extends sourceStoryItems(PanelItem) {

  static name = 'panel-item-story'
  static collapseElement = CollapseStory

  get itemContents() {
    const { UUID } = this.elementState;
    const mdViewerStory = this.defineElement(MDViewerStory, {
      defaults: {
        property: '', UUID: '', editable: false
      },
      attributes: [ 'dialog' ]
    });
    return toElement(mdViewerStory)``({ 
      dialog: () => this.elementState.dialog,
      UUID, property: 'Content', editable: false
    });
  }
}

export { PanelItemStory }
