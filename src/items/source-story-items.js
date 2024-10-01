const sourceStoryItems = (element=Object) => (
  class extends element {
    get itemSources () {
      return this.elementState.metadata_config?.Stories;
    }
  }
)

export { sourceStoryItems }
