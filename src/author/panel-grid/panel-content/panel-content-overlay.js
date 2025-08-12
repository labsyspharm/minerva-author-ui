import panelContentOverlayCSS from './panel-content-overlay.css' assert { type: 'css' };
import { toElement } from '../../../lib/elements';

class PanelContentOverlay extends HTMLElement {

  static name = 'panel-content-overlay'

  static get _styleSheet() {
    return panelContentOverlayCSS;
  }

  get elementTemplate() {
    return toElement('div')`
      <slot name="overlays"></slot>
    `();
  }
}

export { PanelContentOverlay };
