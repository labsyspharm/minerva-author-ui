import { getIcon } from "./md-menu-icons";

const prefix = "md-menu"

/// An icon or label that, when clicked, executes a command.
class MenuItem {
  /// Create a menu item.
  constructor(spec) {
    this.spec = spec
  }

  /// Renders the icon according to its [display
  /// spec](#menu.MenuItemSpec.display), and adds an event handler which
  /// executes the command when the representation is clicked.
  render(view) {
    const spec = this.spec
    let dom = (() => {
      if (!spec.render) return null;
      return spec.render(view);
    })();
    dom = dom || (() => {
      if (!spec.icon) return null;
      return getIcon(view.root, spec.icon);
    })();
    dom = dom || (() => {
      if (!spec.label) return null;
      const label = document.createElement('div');
      label.appendChild(translate(view, spec.label));
      return label;
    })();
    if (!dom) {
      throw new RangeError("MenuItem without icon or label property")
    }
    if (spec.title) {
      const title =
        typeof spec.title === "function" ? spec.title(view.state) : spec.title
      dom.setAttribute("title", translate(view, title))
    }
    if (spec.class) dom.classList.add(spec.class)
    if (spec.css) dom.style.cssText += spec.css

    dom.addEventListener("mousedown", e => {
      e.preventDefault()
      const disabled = dom.classList.contains(
        prefix + "-disabled"
      )
      if (disabled) {
        return;
      }
      spec.run(view.state, view.dispatch, view, e)
    })

    const update = (state) => {
      if (spec.select) {
        const selected = spec.select(state)
        dom.style.display = selected ? "" : "none"
        if (!selected) return false
      }
      let enabled = true
      if (spec.enable) {
        enabled = spec.enable(state) || false
        dom.classList.toggle(prefix + "-disabled", !enabled)
      }
      if (spec.active) {
        const active = (enabled && spec.active(state)) || false
        dom.classList.toggle(prefix + "-active", active)
      }
      return true
    }

    return { dom, update }
  }
}

const toMenuItem = (cmd, options) => {
  return new MenuItem({
    ...options, run: cmd, enable: cmd
  });
}

const translate = (view, text) => {
  return view._props.translate ? view._props.translate(text) : text
}

export { toMenuItem, MenuItem }
