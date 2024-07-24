import {
  MenuItem, liftItem, undoItem, redoItem, icons
} from './md-menu-item';
import { wrapInList } from "prosemirror-schema-list"
import { toggleMark, setBlockType } from 'prosemirror-commands';

const prefix = "md-prompt";

/// Build a menu item for changing the type of the textblock around the
const blockTypeItem = (nodeType, options) => {
  const command = setBlockType(nodeType, options.attrs)
  return new MenuItem({
    run: command, enable: command,
    active: (state) => {
      const {$from, to, node} = state.selection;
      if (node) return node.hasMarkup(nodeType, options.attrs)
      return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs)
    },
    ...options
  })
}

const cmdItem = (cmd, options) => {
  const passedOptions = {
    label: options.title, run: cmd, ...options
  };
  if (!options.enable && !options.select)
    passedOptions[
      options.enable ? "enable" : "select"
    ] = state => cmd(state);
  return new MenuItem(passedOptions);
}

const markActive = (state, type) => {
  const { from, $from, to, empty } = state.selection;
  if (empty)
    return !!type.isInSet(state.storedMarks || $from.marks());
  else
    return state.doc.rangeHasMark(from, to, type);
}

const markItem = (markType, options) => {
  const passedOptions = {
    active: (state) => markActive(state, markType),
    ...options
  };
  return cmdItem(toggleMark(markType), passedOptions);
}

const wrapListItem = (nodeType, options) => {
  return cmdItem(wrapInList(nodeType, options.attrs), options);
}

const linkItem = (markType, linkHandlers) => {
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

const buildMenuItems = (schema, linkHandlers) => {
  const r = {};
  let mark;
  if (mark = schema.marks.strong)
    r.toggleStrong = markItem(
      mark, {
      title: "Toggle strong style", icon: icons.strong
      }
    );
  if (mark = schema.marks.em)
    r.toggleEm = markItem(
      mark, {
      title: "Toggle emphasis", icon: icons.em
      }
    );
  if (mark = schema.marks.link)
    r.toggleLink = linkItem(mark, linkHandlers);
  let node;
  if (node = schema.nodes.bullet_list)
    r.wrapBulletList = wrapListItem(node, {
      title: "Wrap in bullet list",
      icon: icons.bulletList
    });
  if (node = schema.nodes.ordered_list)
    r.wrapOrderedList = wrapListItem(node, {
      title: "Wrap in ordered list",
      icon: icons.orderedList
    });
  if (node = schema.nodes.heading)
    r.makeHead = blockTypeItem(node, {
      title: "Change to heading",
      icon: icons.heading,
      attrs: { level: 2 }
    })

  return [
    [undoItem, redoItem],
    [r.toggleStrong, r.toggleEm, r.toggleLink],
    [r.makeHead, r.wrapBulletList, r.wrapOrderedList, liftItem]
  ];
}

export { buildMenuItems }
