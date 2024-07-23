const configure = (id) => {
  switch (id) {
    case 'EXPORT-DIALOG':
      return {
        id, heading: 'Export',
        dialog: 'Export as Minerva Story',
        actions: [{
          id: 'EXPORT-NOTICE'
        }],
        fields: [{
          label: 'Path for the exported story'
        }]
      }
    case 'EXPORT-NOTICE':
      return { 
        id, heading: 'Export',
        notice: 'Exported Story',
        success: 'Exported Minerva Story'
      }
    case 'SAVEAS-DIALOG':
      return {
        id, heading: 'Save As',
        dialog: 'Save as an editable copy',
        actions: [{
          id: 'SAVEAS-NOTICE'
        }],
        fields: [{
          label: 'Path for the new copy',
          placeholder: '/'
        }]
      }
    case 'SAVEAS-NOTICE':
      return { 
        id, heading: 'Save As', notice: 'Saved',
        success: 'Copy saved successfully'
      }
    case 'SAVE-NOTICE':
      return { 
        id, heading: 'Save', notice: 'Saved',
        success: 'Saved successfully',
        timeout: 3000
      }
    case 'STORY-PANEL':
      return { 
        id, heading: 'Story',
        actions: [{
          id: 'STORY-DIALOG', slot: 'content'
        }]
      }
    case 'STORY-DIALOG':
      return {
        id, heading: 'Edit Waypoint',
        dialog: 'Editing Waypoint',
        fields: [{
          label: 'Title'
        }, {
          label: 'Content',
          markdown: true
        }]
      }
    case 'GROUP-PANEL':
      return { id, heading: 'Channels' }
    case 'IMAGE-PANEL':
      return { id, heading: 'Images' }
    case 'OVERLAY-PANEL':
      return { id, heading: 'Overlays' }
    default:
      return { id }
  }
}

const nav_config = new Proxy({}, {
  get(_, id) {
    return {
      fields: [],
      actions: [],
      ...configure(id)
    };
  }
});

export { nav_config }
