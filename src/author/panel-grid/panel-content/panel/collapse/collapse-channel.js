import { sourceChannelItems } from '../../../../../config/source-channel-items'
import collapseChannelCSS from './collapse-channel.css' assert { type: 'css' };
import { Collapse } from './collapse';

class CollapseChannel extends sourceChannelItems(Collapse) {

  static get _styleSheet() {
    [...Collapse._styleSheet.cssRules].forEach(
      r => collapseChannelCSS.insertRule(r.cssText)
    )
    return collapseChannelCSS;
  }

  static name = 'collapse-channel'
}

export { CollapseChannel }
