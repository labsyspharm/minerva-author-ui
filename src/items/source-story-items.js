const sourceStoryItems = (element) => (
  class extends element {
    get itemSources () {
      return this.elementState.metadata_config?.Stories;
    }
  }
)

export { sourceStoryItems }
