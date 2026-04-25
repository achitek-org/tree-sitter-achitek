try {
  module.exports = require('../../build/Release/tree_sitter_achitekfile_binding');
} catch (_error) {
  module.exports = require('../../build/Debug/tree_sitter_achitekfile_binding');
}

try {
  module.exports.nodeTypeInfo = require('../../src/node-types.json');
} catch (_error) {}
