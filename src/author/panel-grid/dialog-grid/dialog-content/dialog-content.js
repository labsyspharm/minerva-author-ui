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
          label: '', property: ''
        }
      });
      const { nav_config, dialog } = this.elementState;
      const config = nav_config[dialog];
      if (!('fields' in config)) {
        return '';
      }
      const fields = config.fields.map((x) => {
        return toElement(field)``({
          label: x.label, property: x.property,
          markdown: x.markdown || false
        });
      })
      const actions = config.actions.map(({ 
        next, heading, className
      }) => {
        const next_config = nav_config[next];
        return toElement('input')``({
          value: () => {
            return (
              heading || next_config.heading || 'OK'
            );
          },
          'class': () => {
            return [
              'button', className || ''
            ].join(' ');
          },
          '@click': () => {
            this.elementState.dialog = '';
            if (next_config.notice) {
              this.elementState.notice = next;
            }
          },
          type: 'submit'
        })
      });
      return toElement(form)`
        ${() => fields}
        <div class='start left grid menu'>
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
