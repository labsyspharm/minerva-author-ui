const configure = (id) => {
  switch (id) {
    case 'EXPORT-DIALOG':
      return {
        id, heading: 'Export',
        dialog: 'Export as Minerva Story',
        actions: [{
          next: 'EXPORT-NOTICE'
        }],
        fields: [{
          label: 'Path for the exported story'
        }]
      }
    case 'LINK-NOTICE': 
      return {
        id, heading: 'Create',
        notice: 'Create Link',
        fields: [{
          url: 'link URL'
        }],
        actions: [{
          heading: 'Create link'
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
          next: 'SAVEAS-NOTICE'
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
        description: '',
        actions: [{
          next: 'STORY-DIALOG', slot: 'content'
        }]
      }
    case 'STORY-DIALOG':
      return {
        id, heading: 'Edit Waypoint',
        dialog: 'Editing Waypoint',
        fields: [{
          property: 'Name',
          placeholder: 'Untitled Waypoint', label: 'Title'
        }, {
          property: 'Content', markdown: true,
          placeholder: '', label: 'Content'
        }],
        actions: [{
          heading: 'Set Channels'
        },{
          heading: 'Set Viewport'
        },{
          heading: 'Accept Edits',
          className: 'accept'
        }]
      }
    case 'GROUP-PANEL':
      return {
        id, heading: 'Channels',
        description: 'Channel Groups',
        actions: [{
//          next: 'GROUP-DIALOG', slot: 'content'
        }]
      }
    case 'GROUP-DIALOG':
      return {
        id, heading: 'Edit Channel Group',
        dialog: 'Editing Channel Group',
        fields: [{
          property: 'Title',
          placeholder: 'Untitled Group', label: 'Title'
        }],
        actions: [{
          heading: 'Accept Edits',
          className: 'accept'
        }]
      }
    case 'IMAGE-PANEL':
      return { 
        id, heading: 'Images',
        description: 'Image Sources',
      }
    case 'OVERLAY-PANEL':
      return {
        id, heading: 'Overlays',
        description: 'Image Overlays',
      }
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
