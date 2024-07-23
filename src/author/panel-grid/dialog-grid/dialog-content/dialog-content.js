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
    return toElement('div')`
      ${() => this.formTemplate}
    `({});
  }

  get formTemplate() {
    const form = this.defineElement(Form);
    const field = this.defineElement(Field, {
      defaults: {
        markdown: false, label: '', value: ''
      },
      attributes: [ 'markdown' ]
    });
    const { nav_config, dialog } = this.elementState;
    const config = nav_config[dialog];
    if (!('fields' in config)) {
      return '';
    }
    const fields = config.fields.map((x) => {
      const x_attributes = {
        label: x.label, value: x.placeholder || ''
      }
      if (x.markdown) {
        x_attributes.markdown = '';
      }
      return toElement(field)``(x_attributes);
    })
    const actions = config.actions.map(({ id }) => {
      const next_config = nav_config[id];
      return toElement('input')``({
        value: () => next_config.heading,
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
}

export { DialogContent }
