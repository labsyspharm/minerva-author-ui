import formCSS from './form.css' assert { type: 'css' };
import { FormLayout } from '@vaadin/form-layout';

class Form extends FormLayout {
  static name = 'form'

  static get _styleSheet() {
    return formCSS;
  }
}

export { Form }
