module.exports = class MessageCenter {
  constructor() {
    this.dataListeners = [];
    this.cacheSize = 1024;
    this.cache = Buffer.alloc(this.cacheSize);
    this.start = 0;
    this.end = 0;
  }

  get currentDataSize() {
    return this.end >= this.start
      ? this.end - this.start
      : this.cacheSize - (this.start - this.end) 
  }

  data(listener) {
    this.dataListeners.push(listener);
  }

  emit(data) {
    this.dataListeners.forEach(listener => listener(data));
  }

  push(data) {
    const dataLength = data.length;
    if (dataLength <= this.cacheSize - this.currentDataSize) { // 总剩余空间还足够
      if (this.end + dataLength > this.cacheSize) { // 不能直接放在尾部
        const nextEnd = dataLength - (this.cacheSize - this.end);
        this.cache.fill(data, this.end, this.cacheSize);
        this.cache.fill(data.slice(this.cacheSize - this.end), 0, nextEnd);
        this.end = nextEnd;
      } else { // 可以直接放在尾部
        this.cache.fill(data, this.end, this.end + dataLength);
        this.end += dataLength;
      }
      this.decode(); // 直接开始解析
    } else { // 总剩余空间不够, 需要扩容
      const nextCacheSize = 2 * this.cacheSize;
      const nextCache = Buffer.alloc(nextCacheSize);
      const nextStart = 0;
      const nextEnd = this.currentDataSize;

      if (this.end >= this.start) { // 第一种情况, 直接迁移数据
        this.cache.copy(nextCache, 0, this.start, this.end);
      } else {// 第二种情况, 分段迁移数据
        this.cache.copy(nextCache, 0, this.start, this.cacheSize);
        this.cache.copy(nextCache, this.cacheSize - this.start, 0, this.end);
      }

      this.cache = nextCache;
      this.cacheSize = nextCacheSize;
      this.start = nextStart;
      this.end = nextEnd;
      this.push(data); // 扩容之后直接重新调用push函数
    }
  }

  decode() {
    if (this.currentDataSize < 4) { return; }

    let dataSize = 0;
    if (this.currentDataSize - this.start < 4) { // 头4字节被分段
      const headBuffer = Buffer.concat([
        this.cache.subarray(this.start),
        this.cache.subarray(0, 4),
      ]);
      dataSize = headBuffer.readInt32BE(0);
    } else {
      dataSize = this.cache.readInt32BE(this.start);
    }

    if (this.currentDataSize < dataSize) { return; }

    const data = Buffer.alloc(dataSize);

    if (this.start + dataSize > this.cacheSize) { // 包被分段
      const nextStart = dataSize - (this.cacheSize - this.start);
      this.cache.copy(data, 0, this.start, this.cacheSize);
      this.cache.copy(data, this.cacheSize - this.start, 0, nextStart);
      this.start = nextStart;
    } else { // 包没有被分段
      this.cache.copy(data, 0, this.start, this.start + dataSize);
      this.start += dataSize;
    }

    this.emit(data);
    setTimeout(() => this.decode());
  }
}
