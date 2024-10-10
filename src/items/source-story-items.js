const sourceStoryItems = (element=Object) => (
  class extends element {
    get itemSources () {
      return this.elementState.item_registry?.Stories;
    }
  }
)

export { sourceStoryItems }
