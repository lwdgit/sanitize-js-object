const sanitize = require('./sanitize-js.js') 
const resolve = require('path').resolve

function index(filename, opts) {
  return sanitize(require('fs').readFileSync(resolve(filename)).toString(), opts)
}
index.sanitize = sanitize
module.exports = index