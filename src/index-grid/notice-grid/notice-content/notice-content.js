import noticeContentCSS from '#notice-content-css' assert { type: 'css' };
import { IconButton } from '#icon-button';
import { toElement } from '#elements';

class NoticeContent extends HTMLElement {

  static get _styleSheet() {
    return noticeContentCSS;
  }

  get elementTemplate() {
    return toElement('div')`
      ${() => this.elementTemplateContent}
    `({});
  }

  get elementTemplateContent() {
    const button = this.defineElement(IconButton);
    const { nav_config, notice } = this.elementState;
    const config = nav_config.get(notice) || {};
    if (!config.notice) {
      return '';
    }
    return toElement('div')`
      <h2>${() => config.notice}</h2>
      ${this.iconTemplate} 
      <p>${() => config.success}</p>
    `({
       class: 'grid'
     });
  }

  get iconTemplate() {
    const button = this.defineElement(IconButton);
    return toElement(button)``({
      icon: 'icons:close',
      class: 'icon', close: true,
      '@click': (event) => {
        this.elementState.notice = '';
      }
    })
  }
}

export { NoticeContent }
