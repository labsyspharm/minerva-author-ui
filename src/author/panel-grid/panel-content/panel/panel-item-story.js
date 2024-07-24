import { PanelItem } from './panel-item';
import { MDViewerStory } from './md-viewer/md-viewer-story';
import { toElement } from '../../../../lib/elements'

class PanelItemStory extends PanelItem {

  static name = 'panel-item-story'

  get allPanelItems() {
    return this.elementState.metadata_config.stories;
  }

  get itemContents() {
    const { ki } = this.elementState;
    const mdViewerStory = this.defineElement(MDViewerStory, {
      defaults: {
        id: '', ki: '', editable: false
      },
      attributes: [ 'dialog' ]
    });
    return toElement(mdViewerStory)``({ 
      ki, id: 'CONTENT-FIELD',
      dialog: () => this.elementState.dialog,
      editable: false,
    });
  }
}

export { PanelItemStory }
