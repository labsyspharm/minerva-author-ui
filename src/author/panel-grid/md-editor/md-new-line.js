import { replaceStep } from "prosemirror-transform";
import { TextSelection } from "prosemirror-state";

const split = (props) => {
  const {
    skip, type, pos, size, tr
  } = props
  if (skip) {
    return false;
  }
  const map = v => tr.mapping.map(v);
  const start = Math.max(
    map(pos), map(tr.curSelection.from)
  );
  const end = Math.min(
    start + size, map(tr.curSelection.to + 1)
  );
  const step = replaceStep(tr.doc, start, end);
  if (step) tr.step(step)
  tr.split(
    start, 1, [{ type }]
  );
  return true;
}

const toParagraphs = state => {
  const { schema, tr } = state;
  const pos = tr.curSelection.from;
  const to = tr.curSelection.to;
  let replacements = 0;
  const {
    hard_break, paragraph: type
  } = schema.nodes;
  tr.doc.nodesBetween(
    pos, to, (node, pos) => {
      const skip = node.type != hard_break;
      const replaced = split({
        type, pos, tr, skip,
        size: node.nodeSize
      });
      replacements += replaced;
      return true;
    }
  );
  const end_of_line = !tr.doc.resolve(to).nodeAfter;
  if (replacements == 0 && end_of_line) {
    return null;
  }
  split({
    type, tr, pos: to, size: 0
  });
  tr.setSelection(
    TextSelection.create(
      state.apply(tr).doc,
      pos, to + replacements 
    )
  );
  return tr;
}

const enterNewLine = (state, dispatch) => {
  const { tr, schema, selection } = state;
  const map = v => tr.mapping.map(v);
  const { nodeBefore } = tr.doc.resolve(
    selection.from
  );
  const { hard_break } = schema.nodes;
  if (nodeBefore?.type == hard_break) {
    const { paragraph: type } = schema.nodes;
    const pos = tr.curSelection.from;
    const size = tr.curSelection.to - pos;
    tr.setSelection(
      TextSelection.create(
        state.apply(tr).doc,
        pos - 1, pos + size
      )
    );
    split({
      type, tr, 
      pos: pos - 1,
      size: size + 1
    });
  }
  else {
    tr.deleteSelection().insert(
      map(selection.from),
      hard_break.create()
    );
  }
  dispatch(tr);
  return true;
}

export { toParagraphs, enterNewLine }
