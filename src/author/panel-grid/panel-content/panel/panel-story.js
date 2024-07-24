import { Panel } from './panel';
import { PanelItemStory } from './panel-item-story';

class PanelStory extends Panel {

  static name = 'panel-story'
  static itemElement = PanelItemStory

  get allPanelKeys() {
    const items = this.elementState.metadata_config.stories;
    return [...new Array(items.length).keys()]
  }
}

export { PanelStory }
