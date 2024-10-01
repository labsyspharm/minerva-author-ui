const sourceSourceChannels = (element=Object) => (
  class extends element {

    get itemSources () {
      return this.elementState.metadata_config?.SourceChannels;
    }
  }
)

export { sourceSourceChannels }
