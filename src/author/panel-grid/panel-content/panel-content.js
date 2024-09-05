import panelContentCSS from './panel-content.css' assert { type: 'css' };
import { toElement } from '../../../lib/elements';
import { Panel } from './panel/panel';
import { PanelGroup } from './panel/panel-group';
import { PanelStory } from './panel/panel-story';

class PanelContent extends HTMLElement {

  static name = 'panel-content'

  static get _styleSheet() {
    return panelContentCSS;
  }

  get elementTemplate() {
    const { nav_config } = this.elementState;
    const default_panel = this.defineElement(Panel);
    const story_panel = this.defineElement(PanelStory);
    const group_panel = this.defineElement(PanelGroup);
    const description = () => {
      const { tab } = this.elementState;
      if (tab == 'STORY-PANEL') {
        const { metadata_config } = this.elementState;
        return metadata_config['name'];
      }
      return nav_config[tab].description;
    }
    const content = () => {
      const { tab } = this.elementState;
      const el = {
        'STORY-PANEL': story_panel,
        'GROUP-PANEL': group_panel 
      }[tab] || default_panel; 
      return toElement(el)``({});
    }
    return toElement('div')`
      <h2 class="indent">${description}</h2>
      ${content}
    `({
      'class': 'start grid wrapper'
    });
  }
}

export { PanelContent };
