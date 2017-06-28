var acorn = require('acorn')
var injectAcornJsx = require('acorn-jsx/inject')
var injectAcornObjectRestSpread = require('acorn-object-rest-spread/inject')
var injectAcornStaticClassPropertyInitializer = require('acorn-static-class-property-initializer/inject')
var injectES7 = require('acorn-es7')
injectAcornJsx(acorn)
injectAcornObjectRestSpread(acorn)
injectAcornStaticClassPropertyInitializer(acorn)
injectES7(acorn)

var MagicString = require('magic-string')
var walk = require('estree-walker').walk

function sanitizeJS (jsString, opts) {
  opts = opts || {}
  var ast = acorn.parse(jsString, Object.assign({
    sourceType: 'module',
    plugins: {
      objectRestSpread: true,
      jsx: true,
      staticClassPropertyInitializer: true
    }
  }, opts))
  var magicString = new MagicString(jsString)
  var Skip = 0
  walk(ast, {
    enter: function (node, parent) {
      node.parent = function () {
        return parent
      }
      // console.log('node:', (node.name || '\t') + '\t', node.type, node.start, node.end)
      if (Skip > node.start) return

      // 不处理方法
      if (node.type === 'CallExpression') {
        if (node.arguments.length) { Skip = Math.max(Skip, node.arguments[0].start) } else { Skip = Math.max(Skip, node.end) }
        return
      }

      // 不处理左值表达式
      if (parent && parent.type === 'AssignmentExpression' && node === parent.left) {
        Skip = node.end
        return
      }

      // 不处理已经进行过处理的代码
      if (node.type === 'LogicalExpression' && node.operator === '||') {
        Skip = node.end
        return
      }

      // 进行append
      if (node.type === 'Identifier' && parent.type === 'MemberExpression') {
        if (node.end !== parent.property.end || (parent.parent().type === 'MemberExpression' && node.end !== parent.parent().property.end)) { // 不处理最后一个
          magicString.appendLeft(parent.start, '(')
          magicString.appendRight(node.end, ' || {})')
        }
      }
    }
  })

  var out = magicString.toString()
  if (opts.sourceMap) {
    out += '\n//# sourceMappingURL=' + magicString.generateMap().toUrl()
  }
  return out
}
//  sanitizeJS(`
// parent.left.end.a.b
// `)
//  sanitizeJS(`
// (a || {}).b
// `)
//  sanitizeJS(`
// Cache.history = magicString.clone()
// console.log(parent.type)
// `)
// console.log( sanitizeJS(`
// function a () {
// console.log('node:', (node.name || '\t') + '\t', node.type, node.start, node.end)
//       if (Skip >= node.end) return
//       if (Cache.history && node.type === 'Identifier') {
//         if (parent.type === 'MemberExpression') {
//           if (node.end === Cache.end) return
//           magicString.appendLeft(Cache.start, '(')
//           magicString.appendRight(node.end, ' || {})')
//         }

//       } else if (node.type === 'MemberExpression') {
//         if (Cache.start <= node.start && Cache.end >= node.end) return
//         console.log('parent:', parent.type)
//         if (parent.type === 'AssignmentExpression' && node === parent.left) {
//           Skip = parent.left.end
//           return
//         }
//         Cache.start = node.start
//         Cache.end = node.end
//         Cache.history = magicString.clone()
//       }
//       if (Cache.history && parent.type === 'CallExpression') {
//         /**
//          * 排除方法调用，如 Date.now() console.log() 这种，只是单纯的处理属性
//          * */
//         magicString = Cache.history
//         Cache.history = null
//       }
// }
// `) ==
//  sanitizeJS(`
// function a () {
// console.log('node:', (node.name || '    ') + '  ', (node || {}).type, (node || {}).start, (node || {}).end)
//       if (Skip >= (node || {}).end) return
//       if ((Cache || {}).history && (node || {}).type === 'Identifier') {
//         if ((parent || {}).type === 'MemberExpression') {
//           if ((node || {}).end === (Cache || {}).end) return
//           magicString.appendLeft((Cache || {}).start, '(')
//           magicString.appendRight((node || {}).end, ' || {})')
//         }

//       } else if ((node || {}).type === 'MemberExpression') {
//         if ((Cache || {}).start <= (node || {}).start && (Cache || {}).end >= (node || {}).end) return
//         console.log('parent:', (parent || {}).type)
//         if ((parent || {}).type === 'AssignmentExpression' && node === (parent || {}).left) {
//           Skip = ((parent || {}).left || {}).end
//           return
//         }
//         Cache.start = (node || {}).start
//         Cache.end = (node || {}).end
//         Cache.history = magicString.clone()
//       }
//       if ((Cache || {}).history && (parent || {}).type === 'CallExpression') {
//         /**
//          * 排除方法调用，如 Date.now() console.log() 这种，只是单纯的处理属性
//          * */
//         magicString = (Cache || {}).history
//         Cache.history = null
//       }
// }
// `))

module.exports =sanitizeJS 
