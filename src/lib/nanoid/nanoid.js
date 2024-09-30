// Modified from https://github.com/ai/nanoid

const nanoid = (size = 21) => {
  let id = ''
  let i = size
  while (i--) {
    id += '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'[
      (Math.random() * 64) | 0
    ]
  }
  return id
}

export default nanoid
