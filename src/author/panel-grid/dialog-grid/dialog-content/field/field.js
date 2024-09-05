import { TextField } from '../../../../text-field/text-field'
import { TextFieldStory } from './text-field/text-field-story';
import { TextFieldGroup } from './text-field/text-field-group';
import { MDEditor } from '../../../md-editor/md-editor';
import { MDEditorStory } from './md-editor/md-editor-story';
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
    const textFieldStory = this.defineElement(TextFieldStory, {
      defaults: { property: '' }
    });
    const textFieldGroup = this.defineElement(TextFieldGroup, {
      defaults: { property: '' }
    });
    const mdEditor = this.defineElement(MDEditor, {
      defaults: { property: '', linking: false },
      attributes: [ 'linking' ]
    });
    const mdEditorStory = this.defineElement(MDEditorStory, {
      defaults: { property: '', linking: false },
      attributes: [ 'linking' ]
    });
    const { 
      markdown, label, property,
      dialog, notice
    } = this.elementState;
    if (markdown) {
      const el = {
        'STORY-DIALOG': mdEditorStory
      }[dialog] || mdEditor
      const editor = () => {
        return toElement(el)``({ 
          property, linking: () => (
            notice == 'LINK-NOTICE'
          )
        });
      }
      return toElement('div')`
        <label>${() => label}</label>
        ${editor}
      `({
        class: 'contents'
      });
    }
    const el = {
      'STORY-DIALOG': textFieldStory,
      'GROUP-DIALOG': textFieldGroup
    }[dialog] || textField
    return toElement(el)``({
      label, property
    })
  }
}

export { Field }
