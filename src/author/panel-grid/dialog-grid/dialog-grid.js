import { toElement } from '../../../lib/elements';
import { StyledDialog } from './styled-dialog/styled-dialog';
import { DialogContent } from './dialog-content/dialog-content';

class DialogGrid extends HTMLElement {
  static name = 'dialog-grid'

  get elementTemplate() {
    const { content } = this.elementContents;
    const dialog_title = () => {
      const { nav_config, dialog } = this.elementState;
      return nav_config[dialog].dialog;
    }
    return toElement(this.defineElement(StyledDialog))`
      <h3>${dialog_title}</h3>${content}
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

  get elementContents() {
    const dialog = this.defineElement(DialogContent);
    return {
      content: () => {
        return toElement(dialog)``();
      }
    }
  }
}

export { DialogGrid }
