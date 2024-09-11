import { MDEditor } from '../../../md-editor/md-editor'

class MDViewerStory extends MDEditor {
  static name = 'md-viewer-story'

  static elementProperties = new Map([
    ...MDEditor.elementProperties,
    ['ki', { type: Number }]
  ])

  get allContentOptions() {
    const { metadata_config } = this.elementState;
    return metadata_config.Stories;
  }

  get contentOptions() {
    const { allContentOptions } = this;
    const { ki } = this.elementState;
    return allContentOptions[ki] || null;
  }

  attributeChangedCallback(k, old_v, v) {
    if (k == 'dialog' && v == '') {
      this.updateEditorContent(
        this.contentValue
      )
    }
  }
}

export { MDViewerStory }
