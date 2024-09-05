import { toElement } from '../../../../../lib/elements';
import UI5Slider from '@ui5/webcomponents/dist/RangeSlider.js';

class RangeSlider extends UI5Slider {

  static name = 'range-slider'

}

class RangeEditorGroup extends HTMLElement {
  static name = 'range-editor-group'

  static elementProperties = new Map([
    ['ki', { type: Number }],
    ['expanded', { type: Boolean }]
  ])

  get allContentOptions() {
    const { metadata_config } = this.elementState;
    return metadata_config.groups;
  }

  get contentOption() {
    const { allContentOptions } = this;
    const { ki } = this.elementState;
    return allContentOptions[ki] || null;
  }

  get elementTemplate() {
    let rangeInputElement = this.defineElement(
      RangeSlider, { }
    )
    const rangeInput = toElement(rangeInputElement)``();
    const expanded = () => {
      const { expanded } = this.elementState;
      return expanded ? 'ok' : 'no';
    }
    return toElement('div')`${
      rangeInput
    }`({});
  }
}

export { RangeEditorGroup }
