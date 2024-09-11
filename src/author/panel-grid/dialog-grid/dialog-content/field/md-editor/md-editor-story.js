import { MDEditor } from '../../../../md-editor/md-editor'

class MDEditorStory extends MDEditor {
  static name = 'md-editor-story'

  get allContentOptions() {
    const { metadata_config } = this.elementState;
    return metadata_config.Stories;
  }

  get contentOptions() {
    const { allContentOptions } = this;
    const { selections } = this.elementState;
    const { waypoint_key } = selections.find(x => {
      return x.dialog == 'STORY-DIALOG';
    }) || { };
    return allContentOptions.find(x => {
      return x.UUID == waypoint_key
    }) || null;
  }
}

export { MDEditorStory }
