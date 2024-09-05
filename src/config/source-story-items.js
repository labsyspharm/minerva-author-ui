const sourceStoryItems = (element) => (
  class extends element {
    get itemSources () {
      return this.elementState.metadata_config?.stories;
    }
  }
)

export { sourceStoryItems }
