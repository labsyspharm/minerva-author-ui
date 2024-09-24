import { toElement } from '../../../../../lib/elements';
import { sourceChannelItems } from '../../../../../config/source-channel-items'
import rangeEditorChannelCSS from './range-editor-channel.css' assert { type: 'css' };
import { RangeSlider } from './range-slider.js';


class RangeEditorChannel extends sourceChannelItems(HTMLElement) {
  static name = 'range-editor-channel'

  static get _styleSheet() {
    return rangeEditorChannelCSS;
  }

  static elementProperties = new Map([
    ['channel_key', { type: Number }],
    ['group_key', { type: Number }],
    ['expanded', { type: Boolean }]
  ])

  get itemSource() {
    const { itemSources } = this;
    const { channel_key } = this.elementState;
    return itemSources[channel_key] || null;
  }

  get dataType() {
    const { metadata_config } = this.elementState;
    const { Associations } = this.itemSource || {};
    const { SourceDataType } = Associations || {};
    return metadata_config.DataTypes[
      SourceDataType.UUID
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
      min: dataType.LowerRange, max: dataType.UpperRange,
      'start-value:': defaultValues.lowerRange,
      'end-value': defaultValues.UpperRange,
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
