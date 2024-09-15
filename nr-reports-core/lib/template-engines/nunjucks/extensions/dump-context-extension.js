'use strict'
const nunjucks = require('nunjucks')

function DumpContextExtension() {
  this.tags = ['dump']

  this.parse = function(parser, nodes) {

    // get the tag token
    const tok = parser.nextToken()

    // parse the args and move after the block end. passing true
    // as the second arg is required if there are no parentheses
    parser.parseSignature(null, true)
    parser.advanceAfterBlockEnd(tok.value)

    // See above for notes about CallExtension
    return new nodes.CallExtension(this, 'run')
  }

  this.run = function(context) {
    return new nunjucks.runtime.SafeString(`
      <h2>Environment</h2>
      <code>${JSON.stringify(context.env, null, 2)}</code>
      <h2>Variables</h2>
      <code>${JSON.stringify(context.getVariables(), null, 2)}</code>
      `)
  }
}

module.exports = DumpContextExtension
