import styledDialogCSS from '#styled-dialog-css' assert { type: 'css' };
import { WebDialog } from 'web-dialog';

class StyledDialog extends WebDialog {
  static get _styleSheet() {
    return styledDialogCSS;
  }
}

export { StyledDialog }
