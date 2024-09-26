const sourceItemSelection = (element) => (
  class extends element {

    get selectionSources() {
      const { selections } = this.elementState;
      return selections.filter(v => {
        return v.role == 'dialog' && 'item_key' in v;
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
