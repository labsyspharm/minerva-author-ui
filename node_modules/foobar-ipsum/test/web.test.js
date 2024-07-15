describe('Given an instance of the foobar-ipsum generator', function() {

  it('should produce words as expected', function() {
    const dictionary = ['john', 'nolette', 'github']
    const generator = new foobarIpsum({
      dictionary: dictionary
    })

    const word = generator.word()
    expect(dictionary).toContain(word)
  })

  it('should produce sentences within our desired boundaries', function() {
    const bounds = Math.floor(Math.random() * (10 - 1) + 1)
    const generator = new foobarIpsum({
      size: {
        sentence: bounds
      }
    })

    const sentence = generator.sentence()
    expect(sentence.split(' ').length).toBe(bounds)
  })

  it('should produce paragraphs within our desired boundaries', function() {
    const bounds = Math.floor(Math.random() * (5 - 1) + 1)
    const generator = new foobarIpsum({
      size: {
        paragraph: bounds
      }
    })

    const paragraph = generator.paragraph()
    expect(paragraph.split('.').length - 1).toBe(bounds)
  })

})
