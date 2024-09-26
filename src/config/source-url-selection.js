const sourceURLSelection = (element, origin) => (
  class extends element {

    get selectionSources() {
      const { selections } = this.elementState;
      return selections.filter(v => {
        return v.origin == origin && 'url' in v;
      }) || { };
    }

    get itemSource() {
      return this.selectionSources[0] || null;
    }
  }
)

export { sourceURLSelection }
