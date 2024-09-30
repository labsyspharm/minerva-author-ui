import { sourceGroupItems } from '../items/source-group-items';

const sourceGroupChannels = (element) => (
  class extends element {

    get itemSources() {
      const source = new (sourceGroupItems(Object));
      source.elementState = this.elementState; 
      const group = (source.itemSources || []).find(x => {
        return x.UUID == this.elementState.GROUP_UUID; 
      }) || null;
      return group?.Associations.Channels || [];
    }
  }
)

export { sourceGroupChannels }
