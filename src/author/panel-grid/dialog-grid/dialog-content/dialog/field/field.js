import { TextField } from '../../../../../text-field/text-field'
import { TextFieldStory } from './text-field/text-field-story';
import { TextFieldGroup } from './text-field/text-field-group';
import { MDEditor } from '../../../../md-editor/md-editor';
import { MDEditorStory } from './md-editor/md-editor-story';
import { toElement } from '../../../../../../lib/elements'

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
    const { 
      markdown, label, property,
      dialog, notice
    } = this.elementState;
    const TextFieldElement = {
      'STORY-DIALOG': TextFieldStory,
      'GROUP-DIALOG': TextFieldGroup
    }[dialog] || TextField;
    const MDEditorElement = {
      'STORY-DIALOG': MDEditorStory
    }[dialog] || MDEditor
    const textFieldElement = this.defineElement(
      TextFieldElement, {
        defaults: { property: '' }
      }
    );
    const mdEditorElement = this.defineElement(
      MDEditorElement, {
        defaults: { property: '', linking: false },
        attributes: [ 'linking' ]
      }
    );
    if (markdown) {
      const editor = () => {
        return toElement(mdEditorElement)``({ 
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
    return toElement(textFieldElement)``({
      label, property
    })
  }
}

export { Field }
