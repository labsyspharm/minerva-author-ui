const sourceChannelItems = (element) => (
  class extends element {
    get itemSources () {
      return this.elementState.metadata_config?.Channels;
    }
  }
)

export { sourceChannelItems }
