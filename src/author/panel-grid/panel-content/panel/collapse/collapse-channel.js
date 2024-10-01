import { sourceGroupChannels } from '../../../../../items/source-group-channels'
import { useItemIdentifier } from '../../../../../filters/use-item-identifier';
import collapseChannelCSS from './collapse-channel.css' assert { type: 'css' };
import { Collapse } from './collapse';

class CollapseChannel extends sourceGroupChannels(
  useItemIdentifier(Collapse)
) {

  get itemIdentifiers() {
    return {
      UUID: this.elementState.UUID,
      GroupUUID: this.elementState.GroupUUID
    }
  }

  static get _styleSheet() {
    [...Collapse._styleSheet.cssRules].forEach(
      r => collapseChannelCSS.insertRule(r.cssText)
    )
    return collapseChannelCSS;
  }

  static name = 'collapse-channel'
}

export { CollapseChannel }
