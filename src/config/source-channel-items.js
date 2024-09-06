const sourceChannelItems = (element) => (
  class extends element {
    get itemSources () {
      const { metadata_config } = this.elementState;
      const groups = metadata_config?.groups || {};
      const { group_key } = this.elementState;
      const { Channels }= groups[
        group_key 
      ]?.Associations || {};
      return Channels || [];
    }
  }
)

export { sourceChannelItems }
