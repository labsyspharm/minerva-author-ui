const sourceGroupItems = (element=Object) => (
  class extends element {

    get itemSources () {
      return this.elementState.metadata_config?.Groups;
    }
  }
)

export { sourceGroupItems }
