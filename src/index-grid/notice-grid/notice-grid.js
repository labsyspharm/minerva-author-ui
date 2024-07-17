import { toElement } from '../../lib/elements';
import { StyledNotice } from './styled-notice/styled-notice';
import { NoticeContent } from './notice-content/notice-content';

class NoticeGrid extends HTMLElement {

  static allNoticeTimer = new Set();

  get elementTemplate() {
    const notice_element = this.defineElement(NoticeContent);
    const notice_title = () => {
      const { nav_config, notice } = this.elementState;
      const config = nav_config.get(notice) || {};
      return config.notice;
    }
    return toElement(this.defineElement(StyledNotice))`
      <${notice_element}></${notice_element}>
    `({
      open: () => {
        return this.elementState.notice != '';
      },
      class: 'notice',
      '@close': () => {
        this.clearAllNotices(0)
      }
    })
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name != 'open') return;
    if (oldValue != null) return;
    if (newValue == null) return;
    const { nav_config, notice } = this.elementState;
    const config = nav_config.get(notice) || {};
    if (config.timeout) {
      this.clearAllNotices(config.timeout)
    }
  }

  clearAllNotices (timeout=0) {
    clearTimeout(this.constructor.allNoticeTimer);
    this.constructor.allNoticeTimer = setTimeout(
      () => this.elementState.notice = '', timeout
    )
  }
}

export { NoticeGrid }
