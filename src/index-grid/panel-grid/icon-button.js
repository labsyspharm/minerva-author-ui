import iconButtonCSS from '#icon-button-css' assert { type: 'css' };
import { SimpleIconButtonLite } from '@haxtheweb/simple-icon/lib/simple-icon-button-lite.js';

class IconButton extends SimpleIconButtonLite {
  static get _styleSheet() {
    return iconButtonCSS;
  }
}

export { IconButton }
