const sourceGroupItems = (element) => (
  class extends element {
    get itemSources () {
      return this.elementState.metadata_config?.groups;
    }
  }
)

export { sourceGroupItems }
