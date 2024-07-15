import 'foobar-ipsum'

const lorem = new foobarIpsum({
  size: {
    sentence: 5,
    paragraph: 6
  }
})

const to_story = (expanded, length=1) => {
  return {
    expanded,
    summary: lorem.sentence(3),
    content: [...new Array(length)].map(() => {
      return lorem.paragraph()
    })
  }
}

const metadata_config = {
  "name": "Nullam et luctus",
  "stories": [
    to_story(true, 1),
    to_story(false, 2),
    to_story(true, 3),
    to_story(false, 4)
  ]
}

export { metadata_config }
