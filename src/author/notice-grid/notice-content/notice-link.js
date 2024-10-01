import noticeLinkCSS from './notice-link.css' assert { type: 'css' };
import noticeCSS from './notice.css' assert { type: 'css' };
import { Notice } from './notice.js';
import { TextFieldLink } from './text-field/text-field-link';
import { toElement } from '../../../lib/elements'

class NoticeLink extends Notice {
  static name = 'notice-content-link'

  static get _styleSheet() {
    return noticeLinkCSS;
  }

  get elementTemplate() {
    const { nav_config, notice } = this.elementState;
    const config = nav_config[notice];

    const text_field_link = this.defineElement(TextFieldLink, {
      defaults: { label: '', UUID: '' }
    });
    const fields = config.fields.map((x) => {
      return toElement(text_field_link)``({
        label: x.label, UUID: this.elementState.UUID
      });
    });
    const actions = config.actions.map(({
      id, heading
    }) => {
      return toElement('input')``({
        value: () => {
          return heading;
        },
        '@click': () => {
          this.elementState.notice = '';
        },
        class: 'button',
        type: 'submit'
      })
    });
    return toElement('div')`
      <h2>${() => config.title}</h2>
      ${this.iconTemplate} 
      ${() => fields}
      ${() => actions}
    `({
       class: 'grid'
     });
  }
}

export { NoticeLink }
