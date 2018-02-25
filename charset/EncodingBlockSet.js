const EncodingBlock      = require('./EncodingBlock');
module.exports = exports = class EncodingBlockSet extends Array {
  static new() {
    return new EncodingBlockSet();
  }
  
  constructor(...blocks) {
    super();
    if(blocks.length === 0){
      this.push(EncodingBlock.new(0x000000, 0x00007F, 'Basic Latin'))
    }else {
      this.push.apply(this, blocks);
    }
  }

  append(encodingBlock) {
    this.push(encodingBlock);
    return this;
  }

  filter(filterCallback) {
    if(typeof filterCallback === 'function') {
      const filters = Array.from(this).filter(filterCallback);
      return new EncodingBlockSet(...filters);
    } else {
      return this;
    }
  }

  get size() {
    return this.reduce((r, v) => r + v.length, 0);
  }

  get codes() {
    return this.reduce((r, v) => r.concat(v.codes), []);
  }

  get chars() {
    return this.reduce((r, v) => r.concat(v.chars), []);
  }
}