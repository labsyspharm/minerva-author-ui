import { toElement } from '../../../../../lib/elements';
import dialogCSS from './dialog.css' assert { type: 'css' };
import { Field } from './field/field';
import { Form } from './form/form';
//import { DialogItem } from './dialog-item';

class Dialog extends HTMLElement {

  static name = 'dialog'
  //static itemElement = DialogItem 

  static get _styleSheet() {
    return dialogCSS;
  }

  get elementTemplate() {
    const form = this.defineElement(Form);
    const field = this.defineElement(Field, {
      defaults: { 
        editable: true, markdown: false,
        label: '', property: ''
      }
    });
    const config = (key) => {
      const { nav_config, dialog } = this.elementState;
      return nav_config[key || dialog];
    }
    const fields = () => {
      return (config().fields || []).map((x) => {
        return toElement(field)``({
          label: x.label, property: x.property,
          markdown: x.markdown || false
        });
      })
    }
    const actions = () => {
      return config().actions.map(({ 
        label, className
      }) => {
        const { dialog, dialog_notices } = this.elementState;
        const notice = dialog_notices[dialog];
        return toElement('input')``({
          value: () => {
            return label || 'OK';
          },
          'class': () => {
            return [
              'button', className || ''
            ].join(' ');
          },
          '@click': () => {
            this.elementState.dialog = '';
            if (notice) {
              this.elementState.notice = notice;
            }
          },
          type: 'submit'
        })
      });
    }
    return toElement(form)`
      ${fields}
      <div class='start left grid menu'>
        ${actions}
      </div>
    `({});
  }

}

export { Dialog }
