import { undo, redo } from "prosemirror-history";
import { wrapInList } from "prosemirror-schema-list";
import { liftTarget } from 'prosemirror-transform';
import { toggleMark, lift } from 'prosemirror-commands';
import { icons } from "./md-menu-icons";
import { toMenuItem, MenuItem } from "./md-menu-item";
import { toParagraphs } from "./md-new-line";

const wrapInBlock = (nodeType, attrs) => {
  return (state, dispatch) => {
    const { tr } = state;
    const map = v => tr.mapping.map(v);
    const to = map(tr.curSelection.to);
    const from = map(tr.curSelection.from);
    if (dispatch) {
      tr.setBlockType(from, to, nodeType, attrs)
      dispatch(tr);
    }
    return true;
  }
}

const lift_test = (state, dispatch) => {
  const { selection, tr } = state;
  const { list_item } = state.schema.nodes;
  let n_found = 0;
  state.doc.nodesBetween(
    state.selection.from,
    state.selection.to,
    (node, pos) => {
      const found = (
        node.type == list_item
      )
      n_found += found; 
      if (found) {
        const map_resolve = v => (
          tr.doc.resolve(tr.mapping.map(v))
        );
        const from = map_resolve(pos+1);
        const range = from.blockRange(
          map_resolve(pos + node.nodeSize-1)
        );
        const target = range && liftTarget(range);
        if (target != null) {
          tr.lift(range, target)
        }
      }
      return true;
    }
  );
  if (dispatch && n_found > 0) {
    dispatch(tr);
    return true
  }
  return n_found > 0 
}

/// Menu item for the `lift` command.
const liftItem = new MenuItem({
  title: "Lift out of enclosing block",
  run: lift_test,
  select: state => lift_test(state),
  icon: icons.lift
})

/// Menu item for the `undo` command.
const undoItem = new MenuItem({
  title: "Undo last change",
  run: undo,
  enable: state => undo(state),
  icon: icons.undo
})

/// Menu item for the `redo` command.
const redoItem = new MenuItem({
  title: "Redo last undone change",
  run: redo,
  enable: state => redo(state),
  icon: icons.redo
})

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

const toggleStrong = (markType) => {
  return toMenuItem(
    toggleMark(markType), {
      active: (state) => markActive(state, markType),
      title: "Toggle bold", icon: icons.strong
    }
  )
}

const toggleEmphasis = (markType) => {
  return toMenuItem(
    toggleMark(markType), {
      active: (state) => markActive(state, markType),
      title: "Toggle italics", icon: icons.em
    }
  )
}

const wrapList = (nodeType, listType) => {
  return toMenuItem(
    (state, dispatch, view) => {
      let n_found = 0;
      const { list_item } = state.schema.nodes;
      state.doc.nodesBetween(
        state.selection.from,
        state.selection.to,
        (node, pos) => {
          n_found += (
            node.type == list_item
          )
          return true;
        }
      );
      if (n_found > 1) {
        return false;
      }
      const tr = toParagraphs(state);
      if (dispatch && tr) {
        state = state.apply(tr);
        dispatch(tr);
      }
      return wrapInList(nodeType)(
        state, dispatch, view
      )
    }, {
      title: `Wrap in ${listType} list`,
      icon: icons[listType]
    }
  );
}

const toggleHeading = ( nodeType, level ) => {
  const attrs = { level };
  return toMenuItem(
    (state, dispatch, view) => {
      let found_heading = false;
      const {
        hard_break, paragraph
      } = state.schema.nodes;
      state.doc.nodesBetween(
        state.selection.from,
        state.selection.to,
        (node, pos) => {
          if (node.type == nodeType) {
            found_heading = true;
          }
          return true;
        }
      )
      if (found_heading) {
        return wrapInBlock(paragraph)(
          state, dispatch, view
        )
      }
      const tr = toParagraphs(state);
      if (dispatch && tr) {
        state = state.apply(tr);
        dispatch(tr);
      }
      return wrapInBlock(nodeType, attrs)(
        state, dispatch, view
      )
    }, {
      title: `Change to heading`,
      icon: icons.heading
    }
  );
}

const markActive = (state, type) => {
  const { from, $from, to, empty } = state.selection;
  if (empty) {
    const marks = state.storedMarks || $from.marks();
    return !!type.isInSet(marks);
  }
  return state.doc.rangeHasMark(from, to, type);
}

export {
  MenuItem, liftItem, undoItem, redoItem,
  wrapList, linkItem, toggleHeading,
  toggleStrong, toggleEmphasis
};
