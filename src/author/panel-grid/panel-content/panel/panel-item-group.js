import { PanelItem } from './panel-item';
import { toElement } from '../../../../lib/elements'
import panelItemGroupCSS from './panel-item-group.css' assert { type: 'css' };
import { RangeEditorChannel } from './range-editor/range-editor-channel'
import { sourceGroupItems } from '../../../../items/source-group-items'
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

  get itemSourcesForChannels () {
    const { Associations } = this.itemSource;
    return Associations.Channels;
  }

  get itemContents() {
    const rangeEditorElement = this.defineElement(
      RangeEditorChannel, {
        defaults: { UUID: '', GROUP_UUID:  '' },
        attributes: [ 'dialog' ]
      }
    );
    const collapseChannel = this.defineElement(
      CollapseChannel, {
        defaults: { UUID: '', GROUP_UUID:  '', expanded: true },
        attributes: [ 'expanded' ]
      }
    );
    const channels = this.itemSourcesForChannels.map((channel, i) => {
      const item_title = () => {
        return channel.Properties.Name;
      };
      const placeholder = () => {
        return `full histogram placeholder i${i%6}`;
      }
      const rangeEditor = () => {
        const { UUID } = this.elementState;
        return toElement(rangeEditorElement)``({
          GROUP_UUID: () => UUID,
          UUID: () => channel.UUID,
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
        expanded: String(channel.State.Expanded),
        accordion: 'true',
        GROUP_UUID: (
          this.elementState.UUID
        ),
        UUID: channel.UUID,
        class: 'inner'
      });
    });
    return toElement('div')`${channels}`();
  }

  get itemHeading () {
    const itemTitle = () => {
      return toElement('div')`${super.itemHeading}`();
    }
    const channelTitles = () => {
      return this.itemSourcesForChannels.map(channel => {
        return toElement('div')`
          ${channel.Properties.Name}
        `({
          class: 'flex item'
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
