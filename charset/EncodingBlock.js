module.exports = exports = class EncodingBlock extends Array {
  static new(start, limit, info) {
    return new EncodingBlock(start, limit, info);
  }

  constructor(start, limit, info) {
    super();
    if(typeof start === 'number' && typeof limit === 'number') {
      this.info = info;
      this.push.apply(this, Array.from({ length: limit - start + 1 }, (v, k) => k + start));
    } else if(Array.isArray(start)) {
      this.info = limit;
      this.push.apply(this, start);
    } else if(typeof start === 'string') {
      this.info = start;
    }
  }

  get codes() {
    return Array.from(this);
  }

  get chars() {
    return Array.from(this).map((v, k) => String.fromCharCode(v));
  }
}