const sourceSourceChannels = (element=Object) => (
  class extends element {

    get itemSources () {
      return this.elementState.item_registry?.SourceChannels;
    }
  }
)

export { sourceSourceChannels }
