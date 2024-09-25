import dialogContentCSS from './dialog-content.css' assert { type: 'css' };
import { toElement } from '../../../../lib/elements';
import { Dialog } from './dialog/dialog';

class DialogContent extends HTMLElement {
  static name = 'dialog-content'

  static get _styleSheet() {
    return dialogContentCSS;
  }

  get elementTemplate() {
    const default_dialog = this.defineElement(Dialog);
    const content = () => {
      const { dialog } = this.elementState;
      const el = {
      }[dialog] || default_dialog;
      return toElement(el)``({});
    }
    return toElement('div')`
      ${content}
    `({});
  }
}

export { DialogContent }
