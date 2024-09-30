const sourceGroupItems = (element) => (
  class extends element {
    get itemSources () {
      return this.elementState.metadata_config?.Groups;
    }
  }
)

export { sourceGroupItems }
