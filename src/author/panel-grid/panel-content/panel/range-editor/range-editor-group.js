import { toElement } from '../../../../../lib/elements';
import rangeEditorGroupCSS from './range-editor-group.css' assert { type: 'css' };
import UI5Slider from '@ui5/webcomponents/dist/RangeSlider.js';

class RangeSlider extends UI5Slider {

  static name = 'range-slider'

}

class RangeEditorGroup extends HTMLElement {
  static name = 'range-editor-group'

  static get _styleSheet() {
    return rangeEditorGroupCSS;
  }

  static elementProperties = new Map([
    ['group_key', { type: Number }],
    ['expanded', { type: Boolean }]
  ])

  get allContentOptions() {
    const { metadata_config } = this.elementState;
    return metadata_config.Groups;
  }

  get contentOption() {
    const { allContentOptions } = this;
    const { group_key } = this.elementState;
    return allContentOptions[group_key] || null;
  }

  get elementTemplate() {
    let rangeInputElement = this.defineElement(
      RangeSlider, { }
    )
    const rangeInput = toElement(rangeInputElement)``();
    return toElement('div')`${
      rangeInput
    }`({
      class: 'grid'
    });
  }
}

export { RangeEditorGroup }
