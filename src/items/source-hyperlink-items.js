import nanoid from '../lib/nanoid/nanoid'

const sourceHyperlinkItems = (element, origin) => (
  class extends element {
    get itemSources () {
      return this.elementState.metadata_config?.Hyperlinks;
    }
    newItemSource ({ url })  {
      const UUID = nanoid(); 
      this.itemSources.push({ url, UUID });
      return UUID;
    }
  }
)

export { sourceHyperlinkItems }
