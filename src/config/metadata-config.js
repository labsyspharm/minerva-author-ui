import foobarIpsum from 'foobar-ipsum'

const lorem = new foobarIpsum({
  size: {
    sentence: 5,
    paragraph: 6
  }
})

const to_story = (expanded, key, length=1) => {
  return {
    expanded, key,
    title: lorem.sentence(3),
    content: [...new Array(length)].map(() => {
      return lorem.paragraph()
    }).join('\n\n')
  }
}

const metadata_config = {
  "name": "Example Story",
  "stories": [
    to_story(true, 'A', 1),
    to_story(false,'B', 2),
    to_story(true, 'C', 3),
    to_story(false,'D', 4)
  ]
}

export { metadata_config }
