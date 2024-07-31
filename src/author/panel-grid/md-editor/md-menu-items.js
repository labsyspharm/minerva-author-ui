import {
  MenuItem, liftItem, undoItem, redoItem,
  wrapList, linkItem, toggleHeading,
  toggleStrong, toggleEmphasis
} from './md-menu-item';

const prefix = "md-prompt";

const buildMenuItems = (schema, linkHandlers) => {
  const { marks, nodes } = schema;
  const { strong, em, link } = marks;
  const {
    bullet_list, ordered_list, heading
  } = nodes;
  return [
    [
      undoItem, redoItem
    ], [
      toggleStrong(strong),
      toggleEmphasis(em),
      linkItem(link, linkHandlers)
    ], [
      wrapList(bullet_list, 'bullet'),
      wrapList(ordered_list, 'ordered'),
      toggleHeading(heading, 2),
      liftItem
    ]
  ]
}

export { buildMenuItems }
