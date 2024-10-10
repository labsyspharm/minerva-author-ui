import { toElement } from '../../../../../lib/elements';
import { sourceGroupChannels } from '../../../../../items/source-group-channels'
import { useItemIdentifier } from '../../../../../filters/use-item-identifier';
import rangeEditorChannelCSS from './range-editor-channel.css' assert { type: 'css' };
import { RangeSlider } from './range-slider.js';

class RangeEditorChannel extends sourceGroupChannels(
  useItemIdentifier(HTMLElement)
) {
  static name = 'range-editor-channel'

  static get _styleSheet() {
    return rangeEditorChannelCSS;
  }

  get itemIdentifiers() {
    return {
      UUID: this.elementState.UUID,
      GroupUUID: this.elementState.GroupUUID
    }
  }

  get dataType() {
    const { item_registry } = this.elementState;
    const { Associations } = this.itemSource || {};
    const { SourceDataType } = Associations || {};
    return item_registry.DataTypes[
      SourceDataType?.ID
    ] || {
      LowerRange: 0, UpperRange: 65535
    };
  }

  get elementTemplate() {
    const rangeInputElement = this.defineElement(
      RangeSlider, { }
    )
    const dataType = this.dataType;
    const defaultValues = this.itemSource.Properties;
    const rangeInput = toElement(rangeInputElement)``({
      min: String(dataType.LowerRange),
      max: String(dataType.UpperRange),
      'start-value': String(defaultValues.LowerRange),
      'end-value': String(defaultValues.UpperRange),
      class: 'full grid',
      '@input': (e) => {
        const start = e.target.startValue;
        const end = e.target.endValue;
        const { itemSource } = this;
        itemSource.Properties.LowerRange = start;
        itemSource.Properties.UpperRange = end;
      }
    });
    return toElement('div')`${
      rangeInput
    }`({ class: 'full grid' });
  }
}

export { RangeEditorChannel }
