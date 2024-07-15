import styledNoticeCSS from '#styled-notice-css' assert { type: 'css' };
import { WebDialog } from 'web-dialog';

class StyledNotice extends WebDialog {
  static get _styleSheet() {
    return styledNoticeCSS;
  }
}

export { StyledNotice }
