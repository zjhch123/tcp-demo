const net = require('net')
const BB = require('./bb')

const conn = net.connect({
  host: '127.0.0.1',
  port: 8888,
}, () => {
  for (let i = 0; i < 30000; i++) {
    conn.write(BB.pack(Buffer.from('66666666666666666666666666' + i, 'utf-8')).toBuffer());
  }
});
