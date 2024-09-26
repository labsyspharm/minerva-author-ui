const sourceURLSelection = (element) => (
  class extends element {

    get selectionSources() {
      const { selections } = this.elementState;
      return selections.filter(v => {
        return v.role == 'notice' && 'url' in v;
      }) || { };
    }

    get itemSource() {
      return this.selectionSources[0] || null;
    }
  }
)

export { sourceURLSelection }
