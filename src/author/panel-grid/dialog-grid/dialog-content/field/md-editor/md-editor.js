import {
  schema,
  defaultMarkdownParser,
  defaultMarkdownSerializer
} from "prosemirror-markdown";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { buildMenuItems } from './md-menu-items';
import { menuBar } from './md-menu.js';
import MDEditorCSS from './md-editor.css' assert { type: 'css' };

const mdMenu = menuBar({ 
  floating: false,
  content: buildMenuItems(schema)
}); 

class MDEditor extends HTMLElement {
  static name = 'md-editor'

  static get _styleSheet() {
    return MDEditorCSS;
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    const dom = this.shadowRoot;
    const view = new EditorView(dom, {
      state: this.createState('')
    });
  }

  get editorMarkdown() {
    return defaultMarkdownSerializer.serialize(
      this.view.state.doc
    );
  }

  createState(content) {
    return EditorState.create({
      doc: defaultMarkdownParser.parse(content),
      plugins: [
         keymap(baseKeymap), history(), mdMenu
      ]
    })
  }
}

export { MDEditor }
