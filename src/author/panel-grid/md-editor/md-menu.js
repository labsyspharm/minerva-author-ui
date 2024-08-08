import {
  liftItem, undoItem, redoItem,
  wrapList, linkItem, toggleHeading,
  toggleStrong, toggleEmphasis
} from './md-menu-items';

const buildMenuItems = (schema, linkHandlers) => {
  const { marks, nodes } = schema;
  const { strong, em, link } = marks;
  const {
    bullet_list, ordered_list,
    heading, paragraph
  } = nodes;
  return [
    [
      undoItem, redoItem
    ], [
      toggleHeading(heading, 2),
      toggleStrong(strong),
      toggleEmphasis(em),
      linkItem(link, linkHandlers)
    ], [
      wrapList( bullet_list, 'bullet'),
      wrapList( ordered_list, 'ordered'),
      liftItem
    ]
  ]
}

export { buildMenuItems }
