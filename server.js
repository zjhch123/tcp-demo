const net = require('net');
const MessageCenter = require('./MessageCenter');

const msgCenter = new MessageCenter();

net.createServer((socket) => {
  socket.on('data', (d) => msgCenter.push(d));
}).listen(8888);

msgCenter.data((pack) => {
  console.log(pack);
});
