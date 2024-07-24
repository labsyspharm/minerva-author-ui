import dialogContentCSS from './dialog-content.css' assert { type: 'css' };
import { Form } from './form/form';
import { Field } from './field/field';
import { toElement } from '../../../../lib/elements'

class DialogContent extends HTMLElement {
  static name = 'dialog-content'

  static get _styleSheet() {
    return dialogContentCSS;
  }

  get elementTemplate() {
    const { formTemplate } = this.elementContents;
    return toElement('div')`
      ${() => formTemplate(this.elementContents)}
    `({});
  }

  get elementContents() {
    const formTemplate = ({ select, options }) => {
      const form = this.defineElement(Form);
      const field = this.defineElement(Field, {
        defaults: { 
          editable: true, markdown: false,
          label: '', id: ''
        }
      });
      const { nav_config, dialog } = this.elementState;
      const config = nav_config[dialog];
      if (!('fields' in config)) {
        return '';
      }
      const fields = config.fields.map((x) => {
        return toElement(field)``({
          label: x.label, id: x.id,
          markdown: x.markdown || false
        });
      })
      const actions = config.actions.map(({ 
        id, heading
      }) => {
        const next_config = nav_config[id];
        return toElement('input')``({
          value: () => {
            return (
              heading || next_config.heading || 'OK'
            );
          },
          '@click': () => {
            this.elementState.dialog = '';
            if (next_config.notice) {
              this.elementState.notice = id;
            }
          },
          class: 'button',
          type: 'submit'
        })
      });
      return toElement(form)`
        ${() => fields}
        <div class='start left grid'>
          ${() => actions}
        </div>
      `({});
    }
    return {
      formTemplate, options: [],
      select: () => null
    }
  }
}

export { DialogContent }
