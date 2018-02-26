const File            = require('fs');
const Path            = require('path');

const EncodingGroups     = require('./encodings/encodings.json');
const EncodingBlockSet   = require('./EncodingBlockSet');
const EncodingBlock      = require('./EncodingBlock');
const EncodingUnicode    = require('./common/unicode');

module.exports = exports = class EncodingParser extends EncodingBlockSet {
  static new(encodeName) {
    return new EncodingParser(encodeName);
  }

  __findEncode(encodeName) {
    return EncodingGroups.reduce((r, encodingGroup)=>{
      return r || encodingGroup.encodings.find((encode) => {
        return encode.labels.find((label)=>label.indexOf(encodeName.toLowerCase()) === 0);
      });
    }, undefined);
  }

  __parse(presetName) {
    const presetPattern = /^[^#\S]*[0-9]+[\s]+([x0-9A-F]+)/i;
    const preset = File.readFileSync(presetName).toString().split("\n")
      .filter((line) => presetPattern.test(line))
      .map((line) => presetPattern.exec(line))
      .map((line)=>{
        const code = parseInt(line[1], 16);
        const block = EncodingUnicode.find((block) => block.includes(code));
        return { info: block.info, code };
      })
      .reduce((groups, group) => {
        groups[group.info] = groups[group.info] || EncodingBlock.new(group.info);
        groups[group.info].push(group.code);
        return groups;
      }, {});
    this.push.apply(this, Object.values(preset));
  }

  constructor(encodeName, ...blocks) {
    super();
    const encode = encodeName && this.__findEncode(encodeName);
    const preset = encode && Path.resolve(__dirname, `encodings/index-${encode.name.toLowerCase()}.txt`);
    if(preset && File.existsSync(preset)) {
      this.__parse(preset);
    } else {
      this.push.apply(this, blocks);
    }
  }
}