import {
  MenuItem, liftItem, undoItem, redoItem, icons
} from './md-menu-item';
import { TextField } from './md-menu-field';
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

const openPrompt = (options) => {
  const getValues = (fields, domFields) => {
    const result = Object.create(null);
    let i = 0;
    for (let name in fields) {
      const field = fields[name]
      const dom = domFields[i++];
      const value = field.read(dom)
      const bad = field.validate(value);
      if (bad) {
        reportInvalid(dom, bad);
        return null;
      }
      result[name] = field.clean(value);
    }
    return result;
  }
  const wrapper = document.body.appendChild(
    document.createElement("div")
  );
  wrapper.className = prefix;
  const close = () => {
    if (wrapper.parentNode)
      wrapper.parentNode.removeChild(wrapper);
  };
  const domFields = [];
  for (let name in options.fields)
    domFields.push(options.fields[name].render());
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = prefix + "-submit";
  submitButton.textContent = "OK";
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = prefix + "-cancel";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", close);
  const form = wrapper.appendChild(document.createElement("form"));
  if (options.title)
    form.appendChild(document.createElement("h5")).textContent = options.title;
  domFields.forEach(field => {
    form.appendChild(document.createElement("div")).appendChild(field);
  });
  const buttons = form.appendChild(document.createElement("div"));
  buttons.className = prefix + "-buttons";
  buttons.appendChild(submitButton);
  buttons.appendChild(document.createTextNode(" "));
  buttons.appendChild(cancelButton);
  const box = wrapper.getBoundingClientRect();
  wrapper.style.top = ((window.innerHeight - box.height) / 2) + "px";
  wrapper.style.left = ((window.innerWidth - box.width) / 2) + "px";
  const submit = () => {
    const params = getValues(options.fields, domFields);
    if (params) {
      close();
      options.callback(params);
    }
  };
  form.addEventListener("submit", e => {
    e.preventDefault();
    submit();
  });
  const input = form.elements[0];
  if (input)
    input.focus();
}

const linkItem = (markType) => {
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
    openPrompt({
      title: "Create a link",
      fields: {
        href: new TextField({
        label: "Link target",
        required: true
        })
      },
      callback(attrs) {
        toggleMark(markType, attrs)(view.state, view.dispatch);
        view.focus();
      }
    });
  }
  });
}

const buildMenuItems = (schema) => {
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
    r.toggleLink = linkItem(mark);
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
      title: "Change to heading 1",
      icon: icons.heading,
      attrs: { level: 1 }
    })

  return [
    [undoItem, redoItem],
    [r.toggleStrong, r.toggleEm, r.toggleLink],
    [r.makeHead, r.wrapBulletList, r.wrapOrderedList, liftItem]
  ];
}

export { buildMenuItems }
