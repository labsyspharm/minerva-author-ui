import panelContentCSS from './panel-content.css' assert { type: 'css' };
import collapseCSS from './collapse.css' assert { type: 'css' };
import { A11yCollapse } from '@haxtheweb/a11y-collapse';
import { toElement } from '../../../lib/elements';
class Collapse extends A11yCollapse {
  static elementProperties = new Map([
    ...A11yCollapse.elementProperties,
    ['ki', Object]
  ])
  static get _styleSheet() {
    return collapseCSS;
  }
  get expanded () {
    const { items={}, ki } = this.elementState;
    return items[ki].expanded || false;
  }
  set expanded (v) {
    const { items={}, ki } = this.elementState;
    if (items && ki in items) {
      items[ki].expanded = v;
      this.requestUpdate();
    }
    return true;
  }
}

class Panel extends HTMLElement {
  static get _styleSheet() {
    return panelContentCSS;
  }
  get elementTemplate() {
    const { items } = this.elementContents;
    const { itemsTemplate } = this.elementContents;
    return itemsTemplate(items || []);
  }
  get elementContents() {
    const itemsTemplate = (items) => {
      const details = this.defineElement(Collapse, {
        constants: { items }, 
        defaults: { ki: 0 }
      });
      return items.map((item, i) => {
        const paragraphs = item.content.map(text => {
          return toElement('p')`${() => text}`({});
        })
        return toElement(details)`
          <p slot="heading">${() => item.summary}</p>
          <div>${() => paragraphs}</div>
        `({
          accordion: true, ki: i,
          expanded: () => {
            return item.expanded
          },
          class: () => {
            if (i+1 == items.length) {
              return 'end';
            }
            return ''
          }
        });
      });
    }
    return { itemsTemplate };
  }
}

class StoryPanel extends Panel {
  get elementContents() {
    const { stories } = this.elementState.metadata_config;
    return {
      ...super.elementContents, items: stories 
    };
  }
}

class PanelContent extends HTMLElement {

  static get _styleSheet() {
    return panelContentCSS;
  }

  get elementTemplate() {
    const { heading, content } = this.elementContents;
    return toElement('div')`
      <h2 class="indent">${heading}</h2>
      ${content}
    `({
      'class': 'start grid wrapper'
    });
  }

  get elementContents() {
    const default_panel = this.defineElement(Panel);
    const story_panel = this.defineElement(StoryPanel);
    const { nav_config } = this.elementState;
    return {
      heading: () => {
        const { tab } = this.elementState;
        if (tab == 'STORY') {
          const { metadata_config } = this.elementState;
          return metadata_config['name'];
        }
        return nav_config.get(tab).heading
      },
      content: () => {
        const { tab } = this.elementState;
        if (tab == 'STORY') {
          return toElement(story_panel)``({});
        }
        return toElement(default_panel)``({});
      }
    }
  }
}

export { PanelContent };
