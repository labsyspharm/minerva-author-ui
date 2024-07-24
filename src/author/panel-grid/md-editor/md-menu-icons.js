const SVG = "http://www.w3.org/2000/svg"
const XLINK = "http://www.w3.org/1999/xlink"

const prefix = "md-menu-icon"

const hashPath = (path) => {
  let hash = 0
  for (let i = 0; i < path.length; i++)
    hash = ((hash << 5) - hash + path.charCodeAt(i)) | 0
  return hash
}

const getIcon = (root, icon) => {
  const doc = (root.nodeType == 9 ? root : root.ownerDocument) || document
  const node = doc.createElement("div")
  node.className = prefix
  if (icon.path) {
    const { path, width, height } = icon
    const name = "pm-icon-" + hashPath(path).toString(16)
    if (!doc.getElementById(name)) buildSVG(root, name, icon)
    const svg = node.appendChild(doc.createElementNS(SVG, "svg"))
    svg.style.width = width / height + "em"
    const use = svg.appendChild(doc.createElementNS(SVG, "use"))
    use.setAttributeNS(
      XLINK,
      "href",
      /([^#]*)/.exec(doc.location.toString())[1] + "#" + name
    )
  } else if (icon.dom) {
    node.appendChild(icon.dom.cloneNode(true))
  } else {
    const { text, css } = icon
    node.appendChild(doc.createElement("span")).textContent = text || ""
    if (css) node.firstChild.style.cssText = css
  }
  return node
}

const buildSVG = (root, name, data) => {
  const [doc, top] =
    root.nodeType == 9
      ? [root, root.body]
      : [root.ownerDocument || document, root]
  let collection = doc.getElementById(prefix + "-collection")
  if (!collection) {
    collection = doc.createElementNS(SVG, "svg")
    collection.id = prefix + "-collection"
    collection.style.display = "none"
    top.insertBefore(collection, top.firstChild)
  }
  const sym = doc.createElementNS(SVG, "symbol")
  sym.id = name
  sym.setAttribute("viewBox", "0 0 " + data.width + " " + data.height)
  const path = sym.appendChild(doc.createElementNS(SVG, "path"))
  path.setAttribute("d", data.path)
  collection.appendChild(sym)
}

export { getIcon }
