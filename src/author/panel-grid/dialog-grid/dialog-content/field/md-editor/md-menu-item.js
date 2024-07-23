import { lift, joinUp } from "prosemirror-commands"
import { undo, redo } from "prosemirror-history"
import { getIcon } from "./md-menu-icons"

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
    if (!dom) throw new RangeError("MenuItem without icon or label property")
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

const lastMenuEvent = { time: 0, node: null }
const markMenuEvent = (e) => {
  lastMenuEvent.time = Date.now()
  lastMenuEvent.node = e.target
}
const isMenuEvent = (wrapper) => {
  return (
    Date.now() - 100 < lastMenuEvent.time &&
    lastMenuEvent.node &&
    wrapper.contains(lastMenuEvent.node)
  )
}

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
export const renderGrouped = (view, content) => {
  const result = document.createDocumentFragment()
  const updates = [],
    separators = []
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

  function update(state) {
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

function separator() {
  const span = document.createElement('span');
  span.classList.add(prefix + "separator");
  return span;
}

/// A set of basic editor-related icons.
export const icons = {
  join: {
    width: 800,
    height: 900,
    path:
      "M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z"
  },
  lift: {
    width: 1024,
    height: 1024,
    path:
      "M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z"
  },
  undo: {
    width: 1024,
    height: 1024,
    path:
      "M761 1024c113-206 132-520-313-509v253l-384-384 384-384v248c534-13 594 472 313 775z"
  },
  redo: {
    width: 1024,
    height: 1024,
    path:
      "M576 248v-248l384 384-384 384v-253c-446-10-427 303-313 509-280-303-221-789 313-775z"
  },
  strong: {
    width: 805,
    height: 1024,
    path:
      "M317 869q42 18 80 18 214 0 214-191 0-65-23-102-15-25-35-42t-38-26-46-14-48-6-54-1q-41 0-57 5 0 30-0 90t-0 90q0 4-0 38t-0 55 2 47 6 38zM309 442q24 4 62 4 46 0 81-7t62-25 42-51 14-81q0-40-16-70t-45-46-61-24-70-8q-28 0-74 7 0 28 2 86t2 86q0 15-0 45t-0 45q0 26 0 39zM0 950l1-53q8-2 48-9t60-15q4-6 7-15t4-19 3-18 1-21 0-19v-37q0-561-12-585-2-4-12-8t-25-6-28-4-27-2-17-1l-2-47q56-1 194-6t213-5q13 0 39 0t38 0q40 0 78 7t73 24 61 40 42 59 16 78q0 29-9 54t-22 41-36 32-41 25-48 22q88 20 146 76t58 141q0 57-20 102t-53 74-78 48-93 27-100 8q-25 0-75-1t-75-1q-60 0-175 6t-132 6z"
  },
  em: {
    width: 585,
    height: 1024,
    path:
      "M0 949l9-48q3-1 46-12t63-21q16-20 23-57 0-4 35-165t65-310 29-169v-14q-13-7-31-10t-39-4-33-3l10-58q18 1 68 3t85 4 68 1q27 0 56-1t69-4 56-3q-2 22-10 50-17 5-58 16t-62 19q-4 10-8 24t-5 22-4 26-3 24q-15 84-50 239t-44 203q-1 5-7 33t-11 51-9 47-3 32l0 10q9 2 105 17-1 25-9 56-6 0-18 0t-18 0q-16 0-49-5t-49-5q-78-1-117-1-29 0-81 5t-69 6z"
  },
  link: {
    width: 951,
    height: 1024,
    path:
      "M832 694q0-22-16-38l-118-118q-16-16-38-16-24 0-41 18 1 1 10 10t12 12 8 10 7 14 2 15q0 22-16 38t-38 16q-8 0-15-2t-14-7-10-8-12-12-10-10q-18 17-18 41 0 22 16 38l117 118q15 15 38 15 22 0 38-14l84-83q16-16 16-38zM430 292q0-22-16-38l-117-118q-16-16-38-16-22 0-38 15l-84 83q-16 16-16 38 0 22 16 38l118 118q15 15 38 15 24 0 41-17-1-1-10-10t-12-12-8-10-7-14-2-15q0-22 16-38t38-16q8 0 15 2t14 7 10 8 12 12 10 10q18-17 18-41zM941 694q0 68-48 116l-84 83q-47 47-116 47-69 0-116-48l-117-118q-47-47-47-116 0-70 50-119l-50-50q-49 50-118 50-68 0-116-48l-118-118q-48-48-48-116t48-116l84-83q47-47 116-47 69 0 116 48l117 118q47 47 47 116 0 70-50 119l50 50q49-50 118-50 68 0 116 48l118 118q48 48 48 116z"
  },
  bulletList: {
    width: 768,
    height: 896,
    path:
      "M0 512h128v-128h-128v128zM0 256h128v-128h-128v128zM0 768h128v-128h-128v128zM256 512h512v-128h-512v128zM256 256h512v-128h-512v128zM256 768h512v-128h-512v128z"
  },
  orderedList: {
    width: 768,
    height: 896,
    path:
      "M320 512h448v-128h-448v128zM320 768h448v-128h-448v128zM320 128v128h448v-128h-448zM79 384h78v-256h-36l-85 23v50l43-2v185zM189 590c0-36-12-78-96-78-33 0-64 6-83 16l1 66c21-10 42-15 67-15s32 11 32 28c0 26-30 58-110 112v50h192v-67l-91 2c49-30 87-66 87-113l1-1z"
  },
  heading: {
    width: 448,
    height: 512,
    path:
      "M0 64C0 46.3 14.3 32 32 32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 112 224 0 0-112-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 144 0 176 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-144-224 0 0 144 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-176L48 96 32 96C14.3 96 0 81.7 0 64z"
  }
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
