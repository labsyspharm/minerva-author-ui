const useItemSelection = (origin, element=Object) => (
  class extends element {

    get selectionSources() {
      const { selections } = this.elementState;
      return selections.filter(v => {
        return v.origin == origin && 'UUID' in v;
      });
    }

    get itemSource() {
      const { UUID } = this.selectionSources[0] || {};
      return this.itemSources.find(x => {
        return x.UUID == UUID; 
      }) || null;
    }
  }
)

export { useItemSelection }
