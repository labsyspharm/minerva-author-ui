const sourceItemSelection = (element, origin) => (
  class extends element {

    get selectionSources() {
      const { selections } = this.elementState;
      return selections.filter(v => {
        return v.origin == origin && 'item_key' in v;
      });
    }

    get itemSource() {
      const { itemSources } = this;
      const { selectionSources } = this;
      const { item_key } = selectionSources[0] || {};
      return itemSources.find(x => {
        return x.UUID == item_key
      }) || null;
    }
  }
)

export { sourceItemSelection }
