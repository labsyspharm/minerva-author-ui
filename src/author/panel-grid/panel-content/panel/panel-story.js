import { Panel } from './panel';
import { PanelItemStory } from './panel-item-story';
import { sourceStoryItems } from '../../../../items/source-story-items'

class PanelStory extends sourceStoryItems(Panel) {

  static name = 'panel-story'
  static itemElement = PanelItemStory

}

export { PanelStory }
