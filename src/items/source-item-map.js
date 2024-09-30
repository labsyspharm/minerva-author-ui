const sourceItemMap = (element, named_sources) => (
  class extends element {
    get itemMap() {
      const entries = new Map(Object.entries(named_sources));
      return new Map([...entries].map(([name, Source]) => {
        const source = new Source();
        source.elementState = this.elementState; 
        return [ name, source ];
      }));
    }
  }
)

export { sourceItemMap }
