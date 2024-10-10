import { sourceSourceChannels } from './source-source-channels';

const sourceGroupChannels = (element=Object) => (
  class extends element {

    get itemSources() {
      const group_channels = this.elementState.item_registry?.GroupChannels;
      return (group_channels || []).filter(({ Associations: x }) => {
        return x.Group.UUID == this.itemIdentifiers.GroupUUID; 
      });
    }

    getSourceChannel(group_channel) {
      const source_channel = group_channel.Associations.SourceChannel;
      const source = new (sourceSourceChannels(Object));
      source.elementState = this.elementState;
      return source.itemSources.find(channel => {
        return channel.UUID == source_channel.UUID;
      }) || null;
    }
  }
)

export { sourceGroupChannels }
