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
      const placeholder = () => {
        return `full histogram placeholder i${key%6}`;
      }
      return toElement(collapseChannel)`
        <div class="grid one-line" slot="heading">
          <div class="item">
            ${item_title}
          </div>
          ${rangeEditor}
        </div>
        <div slot="content" class="center grid">
          <div class="${placeholder}"></div>
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

  get itemHeading () {
    const { ki: group_key } = this.elementState;
    const expanded = CollapseGroup.is_expanded_item(
      this.itemSources[group_key]
    )
    const itemTitle = () => {
      return toElement('div')`${super.itemHeading}`();
    }
    const itemHeadings = () => {
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
    const flex = () => {
      return toElement('div')`${itemHeadings}`({
        class: 'flex wrap'
      });
    }
    return toElement('div')`${itemTitle}${flex}`({
      class: 'grid'
    })
  }

  get itemHeading () {
    const { ki: group_key } = this.elementState;
    const expanded = CollapseGroup.is_expanded_item(
      this.itemSources[group_key]
    )
    const itemTitle = () => {
      return toElement('div')`${super.itemHeading}`();
    }
    const itemHeadings = () => {
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
    const flex = () => {
      return toElement('div')`${itemHeadings}`({
        class: 'flex wrap'
      });
    }
    return toElement('div')`${itemTitle}${flex}`({
      class: 'grid'
    })
  }
}

export { PanelItemGroup }
