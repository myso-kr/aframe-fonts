const EncodingBlockSet = require('../EncodingBlockSet');
const EncodingBlock = require('../EncodingBlock');

module.exports = exports = EncodingBlockSet.new();
module.exports.push(EncodingBlock.new(0x000000, 0x00007F, 'Basic Latin'));