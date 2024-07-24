import { toElement } from '../../../lib/elements';
import { NoticeLink } from './notice-link';
import { Notice } from './notice';

class NoticeContent extends HTMLElement {
  static name = 'notice-content'

  get elementTemplate() {
    const notice_el = this.defineElement(Notice)
    const notice_link_el = this.defineElement(NoticeLink)
    const content = () => {
      const { notice } = this.elementState;
      const el = {
        'LINK-NOTICE': notice_link_el 
      }[notice] || notice_el;
      return toElement(el)``({
        notice
      });
    }
    return toElement('div')`
      ${content}
    `({});
  }
}

export { NoticeContent }
