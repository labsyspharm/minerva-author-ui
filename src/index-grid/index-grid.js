import indexGridCSS from '#index-grid-css' assert { type: 'css' };
import { toElement } from '#elements';
import { PanelGrid } from '#panel-grid';
import { NoticeGrid } from '#notice-grid';

class IndexGrid extends HTMLElement {
  static get _styleSheet() {
    return indexGridCSS;
  }

  get elementTemplate() {
    const notice_grid = this.defineElement(NoticeGrid, {
      attributes: ['open']
    });
    const panel_grid = this.defineElement(PanelGrid, {
      attributes: ['expanded'],
      defaults: { expanded: true }
    });
    return toElement('div')`
      <img src="data/background.png"/>
      <${panel_grid} class="stretch grid panel outer">
      </${panel_grid}>
      <${notice_grid} class="notice" open="${
        () => this.elementState.notice != ''
      }"></${notice_grid}>
    `({
      class: 'root stretch grid'
    });
  }
}

export { IndexGrid };
