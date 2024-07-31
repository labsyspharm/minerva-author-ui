import { lift, joinUp } from "prosemirror-commands"
import { undo, redo } from "prosemirror-history"
import { getIcon, icons } from "./md-menu-icons"
import { wrapInList } from "prosemirror-schema-list"
import { toggleMark, setBlockType } from 'prosemirror-commands';

const prefix = "md-menu"

/// An icon or label that, when clicked, executes a command.
export class MenuItem {
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
      if (!dom.classList.contains(prefix + "-disabled"))
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

const translate = (view, text) => {
  return view._props.translate ? view._props.translate(text) : text
}

/// Menu item for the `joinUp` command.
export const joinUpItem = new MenuItem({
  title: "Join with above block",
  run: joinUp,
  select: state => joinUp(state),
  icon: icons.join
})

/// Menu item for the `lift` command.
export const liftItem = new MenuItem({
  title: "Lift out of enclosing block",
  run: lift,
  select: state => lift(state),
  icon: icons.lift
})

/// Menu item for the `undo` command.
export const undoItem = new MenuItem({
  title: "Undo last change",
  run: undo,
  enable: state => undo(state),
  icon: icons.undo
})

/// Menu item for the `redo` command.
export const redoItem = new MenuItem({
  title: "Redo last undone change",
  run: redo,
  enable: state => redo(state),
  icon: icons.redo
})

export const linkItem = (markType, linkHandlers) => {
  return new MenuItem({
    title: "Add or remove link",
    icon: icons.link,
    active(state) {
      return markActive(state, markType);
    },
    enable(state) {
      return !state.selection.empty;
    },
    run(state, dispatch, view) {
      if (markActive(state, markType)) {
        toggleMark(markType)(state, dispatch);
        return true;
      }
      linkHandlers.openLinkNotice();
    }
  });
}

export const toggleStrong = (markType) => {
  return cmdItem(
    toggleMark(markType), {
      active: (state) => markActive(state, markType),
      title: "Toggle strong style", icon: icons.strong
    }
  )
}

export const toggleEmphasis = (markType) => {
  return cmdItem(
    toggleMark(markType), {
      active: (state) => markActive(state, markType),
      title: "Toggle emphasis", icon: icons.em
    }
  )
}

export const wrapList = (nodeType, listType) => {
  return cmdItem(
    wrapInList(nodeType), {
      title: `Wrap in ${listType} list`,
      icon: icons[listType]
    }
  );
}

export const toggleHeading = (nodeType, level) => {
  return blockTypeItem(nodeType, {
    title: "Change to heading",
    icon: icons.heading,
    attrs: { level }
  })
}

const cmdItem = (cmd, options) => {
  return new MenuItem({
    ...options, run: cmd, select: cmd
  });
}

const blockTypeItem = (nodeType, options) => {
  const { attrs } = options;
  const command = setBlockType(nodeType, attrs)
  return new MenuItem({
    run: command, enable: command,
    active: (state) => {
      const {$from, node} = state.selection;
      const item = node || $from.parent;
      return item.hasMarkup(nodeType, attrs)
    },
    ...options
  })
}

const markActive = (state, type) => {
  const { from, $from, to, empty } = state.selection;
  if (empty) {
    //console.log('i')
    const marks = state.storedMarks || $from.marks();
    return !!type.isInSet(marks);
  }
  //console.log('ii')
  return state.doc.rangeHasMark(from, to, type);
}
