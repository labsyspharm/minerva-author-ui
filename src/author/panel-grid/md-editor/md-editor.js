import {
  schema,
  defaultMarkdownParser as parser,
  defaultMarkdownSerializer as serializer
} from "prosemirror-markdown";
import { canSplit } from "prosemirror-transform";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { splitListItem } from "prosemirror-schema-list";
import {
  baseKeymap, chainCommands, toggleMark,
  deleteSelection, joinBackward
} from "prosemirror-commands";
import { buildMenuItems } from './md-menu';
import { enterNewLine } from './md-new-line'
import { menuBar } from './md-menu-bar';
import MDEditorCSS from './md-editor.css' assert { type: 'css' };

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
        const newState = this.view.state.apply(transaction);
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
    const {
      list_item, hard_break 
    } = schema.nodes;
    const mdMenu = menuBar({ 
      floating: false,
      content: buildMenuItems(
        schema, {
          openLinkNotice: () => {
            this.elementState.notice = 'LINK-NOTICE'
            this.elementState.selections.push({
              role: 'notice', url: 'https://'
            });
          }
        }
      )
    }); 
    return EditorState.create({
      doc: parser.parse(content),
      plugins: [
        keymap({
          Enter: chainCommands(
            splitListItem(list_item),
            (state, dispatch) => {
              this.view.input.mouseDown = null;
              return enterNewLine(state, dispatch);
            }
          ),
          Backspace: chainCommands(
            deleteSelection, joinBackward
          )
        }),
        history(),
        ...(
          editable ? [ mdMenu ] : []
        )
      ]
    })
  }

  closeLinkNotice(view) {
    const { elementState } = this;
    const selection = elementState.selections.find(
      v => (v.role == 'notice' && 'url' in v)
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
    const { Properties } = this.itemSource || {};
    return (Properties || {})[
      this.elementState.property
    ] || '';
  }

  set contentValue(v) {
    const { property } = this.elementState;
    const { Properties } = this.itemSource || {};
    if (Properties && property in Properties) {
      Properties[property] = v;
    }
  }

  itemSource() {
    return null; // Defined in derived classes
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
