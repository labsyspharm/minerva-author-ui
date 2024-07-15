# foobar-ipsum

[![npm](https://img.shields.io/npm/dm/foobar-ipsum.svg)](https://www.npmjs.com/package/foobar-ipsum)

[![build](https://travis-ci.org/neetjn/foobar-ipsum.svg?branch=master)](https://travis-ci.org/neetjn/foobar-ipsum/)
[![npm version](https://badge.fury.io/js/foobar-ipsum.svg)](https://badge.fury.io/js/foobar-ipsum)
[![codecov](https://codecov.io/gh/neetjn/foobar-ipsum/branch/master/graph/badge.svg)](https://codecov.io/gh/neetjn/foobar-ipsum)

[![NPM](https://nodei.co/npm/foobar-ipsum.png)](https://nodei.co/npm/foobar-ipsum/)

## About

**foobar-ipsum** is a lightweight, universal javascript module for generating scaffolding text.

## Usage

To install via NPM:
```sh
npm install foobar-ipsum
```
For a quick start using jsdelivr:
```html
<script src="https://cdn.jsdelivr.net/npm/foobar-ipsum/dist/foobar-ipsum.min.js"></script>
```

**foobar-ipsum** supports the following options:

> **`size.sentence`** ; `int` **15** : Length of a sentence (words).

> **`size.paragraph`** ; `int` **3** : Length of a paragraph (sentences).

> **`dictionary`** ; `array` : List of words for generator to pool from.

#### Generator API

> **`word()`**: Generate a random word given the provided dictionary.

> **`sentence(size = null)`**: Create a random sentence given the provided dictionary and sentence bounds.

> **`paragraph(size = null, eoc = null)`**: Create a random paragraph given the provided dictionary and paragraph bounds.

The generator can be used like so:

```js
import foobarIpsum from 'foobar-ipsum'

const generator = foobarIpsum({
  size: {
    sentence: 10,
    paragraph: 4
  }
})

let word = generator.word()
let sentence = generator.sentence()
let paragraph = generator.paragraph(null, '<br />')
```

### Contributors

* **John Nolette** (john@neetgroup.net)

### Fork Contributors

* **Nickolas Kenyeres**
* **Marco Biedermann**
* **Martin Grandrath**
* **Florian Wendelborn**
* **Melvin Tiong**

Contributing guidelines are as follows,

* Any new features must include either a unit test, e2e test, or both.
* Branches for bugs and features should be structued like so, `issue-x-username`.
* Before putting in a pull request, be sure to verify you've built all your changes.

  Travis will build your changes before testing and publishing, but bower pulls from this repository directly.

* Include your name and email in the contributors list.

---
Copyright (c) 2017 John Nolette Licensed under the MIT license.

