const sourceNamespace = (element, named_sources) => (
  class extends element {
    get namespaceSources() {
      const entries = Object.entries(named_sources);
      return entries.reduce((output, [name, Source]) => {
        const source = new Source();
        const { elementState } = this;
        source.elementState = elementState; 
        return { ...output, [name]: source };
      }, {});
    }
  }
)

export { sourceNamespace }
