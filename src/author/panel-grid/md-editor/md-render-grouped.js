const combineUpdates = (updates, nodes) => {
  return state => {
    let something = false
    for (let i = 0; i < updates.length; i++) {
      const up = updates[i](state)
      nodes[i].style.display = up ? "" : "none"
      if (up) something = true
    }
    return something
  }
}

/// Render the given, possibly nested, array of menu elements into a
/// document fragment, placing separators between them (and ensuring no
/// superfluous separators appear when some of the groups turn out to
/// be empty).
export const renderGrouped = (view, content, prefix) => {
  const result = document.createDocumentFragment()
  const updates = [],
    separators = []
  const separator = () => {
    const span = document.createElement('span');
    span.classList.add(prefix + "separator");
    return span;
  }
  for (let i = 0; i < content.length; i++) {
    const items = content[i],
      localUpdates = [],
      localNodes = []
    for (let j = 0; j < items.length; j++) {
      const { dom, update } = items[j].render(view)
      const span = document.createElement('span');
      span.classList.add(prefix + "item");
      span.appendChild(dom);
      result.appendChild(span)
      localNodes.push(span)
      localUpdates.push(update)
    }
    if (localUpdates.length) {
      updates.push(combineUpdates(localUpdates, localNodes))
      if (i < content.length - 1)
        separators.push(result.appendChild(separator()))
    }
  }

  const update = (state) => {
    let something = false,
      needSep = false
    for (let i = 0; i < updates.length; i++) {
      const hasContent = updates[i](state)
      if (i)
        separators[i - 1].style.display = needSep && hasContent ? "" : "none"
      needSep = hasContent
      if (hasContent) something = true
    }
    return something
  }
  return { dom: result, update }
}
