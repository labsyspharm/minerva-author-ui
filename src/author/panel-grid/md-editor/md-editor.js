import {
  schema,
  defaultMarkdownParser as parser,
  defaultMarkdownSerializer as serializer
} from "prosemirror-markdown";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import { buildMenuItems } from './md-menu-items';
import { menuBar } from './md-menu.js';
import MDEditorCSS from './md-editor.css' assert { type: 'css' };

const mapFieldToContent = (id) => {
  return {
    'TITLE-FIELD': 'title',
    'CONTENT-FIELD': 'content'
  }[id] || id;
}

class MDEditor extends HTMLElement {
  static name = 'md-editor'

  static get _styleSheet() {
    return MDEditorCSS;
  }

  static elementProperties = new Map([
    ['editable', { type: Boolean }],
    ['linking', { type: Boolean }]
  ])

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    const dom = this.shadowRoot;
    this.view = new EditorView(dom, {
      editable: () => this.elementState.editable,
      state: this.createState(this.contentValue),
      dispatchTransaction: (transaction) => {
        const newState = this.view.state.apply(transaction)
        const newContent = serializer.serialize(newState.doc);
        this.view.updateState(newState);
        this.contentValue = newContent;
      }
    });
  }

  updateEditorContent(content) {
    if (!this.view) return;
    this.view.updateState(this.createState(content));
  }

  createState(content) {
    const { editable } = this.elementState;
    const mdMenu = menuBar({ 
      floating: false,
      content: buildMenuItems(
        schema, {
          openLinkNotice: () => {
            this.elementState.notice = 'LINK-NOTICE'
            this.elementState.selections.push({
              notice: 'LINK-NOTICE',
              url: 'https://'
            });
          }
        }
      )
    }); 
    return EditorState.create({
      doc: parser.parse(content),
      plugins: [
         keymap(baseKeymap), history(),
         ...(() => {
           if (!editable) {
              return [];
           }
           return [mdMenu]
         })()
      ]
    })
  }

  closeLinkNotice(view) {
    const { elementState } = this;
    const selection = elementState.selections.find(
      v => ('notice' in v && 'url' in v)
    )
    if (selection == null || !view) {
      return;
    }
    elementState.selections = (
      elementState.selections.filter(
        v => v != selection
      )
    )
    const href = selection.url;
    toggleMark(schema.marks.link, { href })(
      view.state, view.dispatch
    );
    view.focus();
  }

  get editorMarkdown() {
    return serializer.serialize(
      this.view.state.doc
    );
  }

  get contentValue() {
    const { contentOptions } = this;
    const { id } = this.elementState;
    const key = mapFieldToContent(id);
    return contentOptions[key];
  }

  set contentValue(v) {
    const { contentOptions } = this;
    const { id } = this.elementState;
    const key = mapFieldToContent(id);
    if (contentOptions && key in contentOptions) {
      contentOptions[key] = v;
    }
  }

  get allContentOptions() {
    return [];
  }

  contentOptions() {
    return null;
  }

  attributeChangedCallback(k, old_v, v) {
    if (k == 'linking' && v == null) {
      this.closeLinkNotice(this.view)
    }
  }
}

export { 
  MDEditor
}
