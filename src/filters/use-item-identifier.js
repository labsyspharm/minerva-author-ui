const useItemIdentifier = (element=Object) => (
  class extends element {

    get itemSource() {
      const { UUID } = {
        UUID: this.elementState.UUID,
        ...(this.itemIdentifiers || null)
      };
      return (this.itemSources || []).find(x => {
        return x.UUID == UUID; 
      }) || null;
    }
  }
)

export { useItemIdentifier }
