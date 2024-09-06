import { PanelItem } from './panel-item';
import { toElement } from '../../../../lib/elements'
import { RangeEditorGroup } from './range-editor/range-editor-group'
import { sourceGroupItems } from '../../../../config/source-group-items'
import { CollapseGroup } from './collapse/collapse-group';
import { CollapseChannel } from './collapse/collapse-channel';

class PanelItemGroup extends sourceGroupItems(PanelItem) {

  static name = 'panel-item-group'
  static collapseElement = CollapseGroup

  get itemKeysForChannels () {
    return [
      ...Object.keys(this.itemSourcesForChannels)
    ];
  }

  get itemSourcesForChannels () {
    const { ki: group_key } = this.elementState;
    const { Associations } = this.itemSources[group_key];
    return Associations.Channels;
  }

  get itemContents() {
    const { ki: group_key } = this.elementState;
    const rangeEditorElement = this.defineElement(
      RangeEditorGroup, {
        defaults: { group_key: '' },
        attributes: [ 'dialog' ]
      }
    );
    const rangeEditor = () => {
      return toElement(rangeEditorElement)``();
    }
    const collapseChannel = this.defineElement(
      CollapseChannel, {
        defaults: { ki: '', group_key: '' }
      }
    );
    const channels = this.itemKeysForChannels.map(key => {
      const channel = this.itemSourcesForChannels[key];
      const item_title = () => {
        return channel.Properties.Name;
      };
      return toElement(collapseChannel)`
        <p slot="heading">${item_title}</p>
        <div slot="content">
          <div class="full text">
            ${rangeEditor}
          </div>
        </div>
      `({
        accordion: true,
        ki: key, group_key,
        class: 'inner',
        expanded: ''
      });
    });
    return toElement('div')`${channels}`();
  }

}

export { PanelItemGroup }
