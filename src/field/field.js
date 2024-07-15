import fieldCSS from '#field-css' assert { type: 'css' };
import { TextField } from '@vaadin/text-field';

class Field extends TextField {
  constructor() {
    super();
  }
  static get _styleSheet() {
    return fieldCSS;
  }
}

export { Field }
