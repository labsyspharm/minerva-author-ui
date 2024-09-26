import { PanelItem } from './panel-item';
import { toElement } from '../../../../lib/elements'
import panelItemGroupCSS from './panel-item-group.css' assert { type: 'css' };
import { RangeEditorChannel } from './range-editor/range-editor-channel'
import { sourceGroupItems } from '../../../../config/source-group-items'
import { CollapseGroup } from './collapse/collapse-group';
import { CollapseChannel } from './collapse/collapse-channel';

class PanelItemGroup extends sourceGroupItems(PanelItem) {

  static name = 'panel-item-group'
  static collapseElement = CollapseGroup

  static get _styleSheet() {
    [...PanelItem._styleSheet.cssRules].forEach(
      r => panelItemGroupCSS.insertRule(r.cssText)
    )
    return panelItemGroupCSS;
  }

  get itemKeysForChannels () {
    return [
      ...Object.keys(this.itemSourcesForChannels)
    ];
  }

  get itemSourcesForChannels () {
    const { item_key } = this.elementState;
    const { Associations } = this.itemSources[item_key];
    return Associations.Channels;
  }

  get itemContents() {
    const { item_key } = this.elementState;
    const rangeEditorElement = this.defineElement(
      RangeEditorChannel, {
        defaults: { item_key: '', group_key: '' },
        attributes: [ 'dialog' ]
      }
    );
    const collapseChannel = this.defineElement(
      CollapseChannel, {
        defaults: { item_key: '', group_key: '' }
      }
    );
    const channels = this.itemKeysForChannels.map(channel_key => {
      const channel = this.itemSourcesForChannels[channel_key];
      const item_title = () => {
        return channel.Properties.Name;
      };
      const placeholder = () => {
        return `full histogram placeholder i${channel_key%6}`;
      }
      const rangeEditor = () => {
        return toElement(rangeEditorElement)``({
          item_key: channel_key,
          group_key: item_key,
          class: "full"
        });
      }
      return toElement(collapseChannel)`
        <div class="grid one-line" slot="heading">
          <div class="item">
            ${item_title}
          </div>
        </div>
        <div slot="content" class="center grid">
          <div class="${placeholder}"></div>
          ${rangeEditor}
        </div>
      `({
        accordion: true,
        item_key: channel_key,
        group_key: item_key,
        class: 'inner',
        expanded: ''
      });
    });
    return toElement('div')`${channels}`();
  }

  get itemHeading () {
    const { item_key } = this.elementState;
    const expanded = CollapseGroup.is_expanded_item(
      this.itemSources[item_key]
    )
    const itemTitle = () => {
      return toElement('div')`${super.itemHeading}`();
    }
    const channelTitles = () => {
      if (expanded) {
        return [];
      }
      return this.itemKeysForChannels.map(key => {
        const channel = this.itemSourcesForChannels[key];
        return toElement('div')`
          ${channel.Properties.Name}
        `({
          class: 'flex item', key
        });
      })
    }
    const channels = () => {
      return toElement('div')`${channelTitles}`({
        class: 'flex wrap'
      });
    }
    return toElement('div')`${itemTitle}${channels}`({
      class: 'grid'
    })
  }
}

export { PanelItemGroup }
