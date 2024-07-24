import noticeCSS from './notice.css' assert { type: 'css' };
import { IconButton } from '../../panel-grid/icon-button';
import { toElement } from '../../../lib/elements';

class Notice extends HTMLElement {
  static name = 'notice'

  static get _styleSheet() {
    return noticeCSS;
  }

  get elementTemplate() {
    const { nav_config, notice } = this.elementState;
    const config = nav_config[notice];
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

export { Notice }
