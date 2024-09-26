const configure = (id) => {
  switch (id) {
    case 'EXPORT-DIALOG':
      return {
        id, label: 'Export',
        title: 'Export as Minerva Story',
        role: 'dialog',
        actions: [{
          label: 'Export'
        }],
        fields: [{
          label: 'Path for the exported story'
        }]
      }
    case 'LINK-NOTICE': 
      return {
        id, label: 'Create',
        title: 'Create Link',
        role: 'notice',
        fields: [{
          url: 'link URL'
        }],
        actions: [{
          label: 'Create link'
        }]
      }
    case 'EXPORT-NOTICE':
      return { 
        role: 'notice',
        id, label: 'Export',
        title: 'Exported Story',
        success: 'Exported Minerva Story'
      }
    case 'SAVEAS-DIALOG':
      return {
        id, label: 'Save As',
        title: 'Save as an editable copy',
        role: 'dialog',
        actions: [{
          label: 'Save As'
        }],
        fields: [{
          label: 'Path for the new copy',
          placeholder: '/'
        }]
      }
    case 'SAVEAS-NOTICE':
      return { 
        role: 'notice',
        id, label: 'Save As', title: 'Saved',
        success: 'Copy saved successfully'
      }
    case 'SAVE-NOTICE':
      return { 
        role: 'notice',
        id, label: 'Save', title: 'Saved',
        success: 'Saved successfully',
        timeout: 3000
      }
    case 'STORY-PANEL':
      return { 
        role: 'tab',
        id, label: 'Story',
        description: '',
        actions: [{
          slot: 'content'
        }]
      }
    case 'STORY-DIALOG':
      return {
        role: 'dialog',
        id, label: 'Edit Waypoint',
        title: 'Editing Waypoint',
        fields: [{
          property: 'Name',
          placeholder: 'Untitled Waypoint', label: 'Title'
        }, {
          property: 'Content', markdown: true,
          placeholder: '', label: 'Content'
        }],
        actions: [{
          label: 'Set Channels'
        },{
          label: 'Set Viewport'
        },{
          label: 'Accept Edits',
          className: 'accept'
        }]
      }
    case 'GROUP-PANEL':
      return {
        role: 'tab',
        id, label: 'Channels',
        description: 'Channel Groups',
        actions: [{
        }]
      }
    case 'GROUP-DIALOG':
      return {
        role: 'dialog',
        id, label: 'Edit Channel Group',
        title: 'Editing Channel Group',
        fields: [{
          property: 'Title',
          placeholder: 'Untitled Group', label: 'Title'
        }],
        actions: [{
          label: 'Accept Edits',
          className: 'accept'
        }]
      }
    case 'IMAGE-PANEL':
      return { 
        role: 'tab',
        id, label: 'Images',
        description: 'Image Sources',
      }
    case 'OVERLAY-PANEL':
      return {
        role: 'tab',
        id, label: 'Overlays',
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
