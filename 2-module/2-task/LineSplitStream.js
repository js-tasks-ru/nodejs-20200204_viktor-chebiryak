const stream = require('stream');
const { EOL } = require('os');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);
    this.leftovers = '';
  }

  _transform(chunk, encoding, callback) {
    const parts = chunk.toString().split(EOL);
    const lastPart = parts.pop();
    if (this.leftovers && parts[0]) {
      parts[0] = this.leftovers + parts[0];
      this.leftovers = '';
    }
    this.leftovers += lastPart;
    parts.forEach((part) => {
      this.push(part.trim());
    });
    callback(null);
  }

  _flush(callback) {
    this.push(this.leftovers);
    callback(null);
  }
}

module.exports = LineSplitStream;
