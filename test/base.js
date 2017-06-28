const sanitizeJS = require('..')
const sanitize = sanitizeJS.sanitize
const test = require('ava')
const readFile = require('fs').readFileSync

test('base', t => {
  t.is('(document || {})[hiddenProperty]', sanitize(`document[hiddenProperty]`))
  t.is('((((parent || {}).left || {}).end || {}).a || {}).b', sanitize('parent.left.end.a.b'))
  
  t.is(`Cache.history = magicString.clone();
   console.log((parent || {}).type)`, sanitize(`Cache.history = magicString.clone();
   console.log(parent.type)`))
})

test('no change', t => {
  t.is('(a || {}).b', sanitize('(a || {}).b'))
})

test('real-world', t => {
  t.is(readFile('./test/_real_world_sanitize.js').toString(), sanitizeJS('./test/_real_world.js'))
})
