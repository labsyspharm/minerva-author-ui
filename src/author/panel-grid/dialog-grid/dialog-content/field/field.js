import { TextField } from './text-field/text-field';
import { MDEditor } from './md-editor/md-editor';
import { toElement } from '../../../../../lib/elements'

class Field extends HTMLElement {
  static name = 'field'

  static elementProperties = new Map([
    ['markdown', { type: Boolean }]
  ])

  get elementTemplate() {
    return toElement('div')`
      ${() => this.fieldTemplate}
    `({
      class: 'contents'
    });
  }

  get fieldTemplate() {
    const textField = this.defineElement(TextField);
    const mdEditor = this.defineElement(MDEditor);
    const { 
      markdown, label, value
    } = this.elementState;
    console.log(markdown, typeof markdown);
    if (markdown) {
      const editor = toElement(mdEditor)``({})
      return toElement('div')`
        <label>${() => label}</label>
        ${() => editor}
      `({
        class: 'contents'
      });
    }
    return toElement(textField)``({
      label, value
    })
  }
}

export { Field }
