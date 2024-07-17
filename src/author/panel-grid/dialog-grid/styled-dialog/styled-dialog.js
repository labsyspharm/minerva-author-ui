import styledDialogCSS from './styled-dialog.css'
import { WebDialog } from 'web-dialog';

class StyledDialog extends WebDialog {
  static name = 'styled-dialog'

  static get _styleSheet() {
    return styledDialogCSS;
  }
}

export { StyledDialog }
