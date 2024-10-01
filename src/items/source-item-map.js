const sourceItemMap = (item_map, element=Object) => (
  class extends element {
    get itemMap() {
      const entries = new Map(Object.entries(item_map));
      return new Map([...entries].map(([name, Source]) => {
        const source = new Source();
        source.elementState = this.elementState; 
        Object.defineProperty(source, 'itemIdentifiers', {
          get: () => this.itemIdentifiers
        })
        return [ name, source ];
      }));
    }
  }
)

export { sourceItemMap }
