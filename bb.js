class BB {
  constructor(b) {
    this.length = b.length;
    this.content = b;
  }

  toBuffer() {
    const head = Buffer.alloc(4);
    head.writeInt32BE(this.length + 4, 0);
    const buffer = Buffer.concat([head, this.content]);

    return buffer;
  }

  static pack(b) {
    return new BB(b);
  }
}

module.exports = BB;
