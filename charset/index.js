const EncodingParser = require('./EncodingParser');
module.exports = exports = class Charset {
  static load(charsetName, filterCallback) {
    return EncodingParser.new(charsetName).filter(filterCallback);
  }
};