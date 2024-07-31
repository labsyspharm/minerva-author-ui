import { Plugin } from "prosemirror-state"
import { renderGrouped } from "./md-render-grouped"

const prefix = "md-menu"

export function menuBar(options) {
  return new Plugin({
    view(editorView) {
      const menuView = new MenuBarView(editorView, options);
      editorView.dom.parentNode.insertBefore(
        menuView.dom, editorView.dom
      )
      return menuView;
    }
  })
}

class MenuBarView {

  constructor(editorView, options) {
    this.editorView = editorView
    this.options = options
    this.root = editorView.root
    this.dom = document.createElement('div');
    this.dom.className = prefix

    this.grouped = renderGrouped(
      this.editorView, this.options.content, prefix
  )
    this.dom.appendChild(this.grouped.dom)
    this.update()
  }

  update() {
    this.grouped.update(this.editorView.state)
  }
}
