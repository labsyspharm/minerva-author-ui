import { toElement } from '../../../lib/elements';
import { StyledDialog } from './styled-dialog/styled-dialog';
import { DialogContent } from './dialog-content/dialog-content';

class DialogGrid extends HTMLElement {

  get elementTemplate() {
    const dialog_element = this.defineElement(DialogContent);
    const dialog_title = () => {
      const { nav_config, dialog } = this.elementState;
      const config = nav_config.get(dialog) || {};
      return config.dialog;
    }
    return toElement(this.defineElement(StyledDialog))`
      <span>${dialog_title}</span>
      <${dialog_element}></${dialog_element}>
    `({
      open: () => {
        return this.elementState.dialog != '';
      },
      class: 'dialog',
      '@close': () => {
        const { dialog } = this.elementState;
        this.elementState.dialog = '';
      }
    })
  }
}

export { DialogGrid }
