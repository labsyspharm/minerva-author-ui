import formCSS from '#form-css' assert { type: 'css' };
import { FormLayout } from '@vaadin/form-layout';

class Form extends FormLayout {
  constructor() {
    super();
  }
  static get _styleSheet() {
    return formCSS;
  }
}

export { Form }
