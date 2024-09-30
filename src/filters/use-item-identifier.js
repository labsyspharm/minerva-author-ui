const useItemIdentifier = (element) => (
  class extends element {

    get itemSource() {
      const { UUID } = this.elementState;
      return (this.itemSources || []).find(x => {
        return x.UUID == UUID; 
      }) || null;
    }
  }
)

export { useItemIdentifier }
