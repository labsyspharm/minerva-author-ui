import dialogContentCSS from './dialog-content.css' assert { type: 'css' };
import { Form } from '../../../../form/form';
import { Field } from '../../../../field/field';
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
    const field = this.defineElement(Field);
    const { nav_config, dialog } = this.elementState;
    const config = nav_config.get(dialog) || {};
    if (!('fields' in config)) {
      return '';
    }
    const fields = config.fields.map((x) => {
      return toElement(field)``({
        label: x.label, value: x.placeholder || ''
      })
    })
    const submit = toElement('input')``({
      value: () => config.submit,
      '@click': () => {
        this.elementState.dialog = '';
        if (config.notice) {
          this.elementState.notice = config.id;
        }
      },
      class: 'button',
      type: 'submit'
    })
    return toElement(form)`
      ${() => fields}
      <div class='start left grid'>
        ${() => submit}
      </div>
    `({});
  }
}

export { DialogContent }
