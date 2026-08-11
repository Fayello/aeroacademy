const net = require('net');

async function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      console.log(`Port ${port} is NOT free: ${err.code}`);
      resolve(false);
    });
    server.once('listening', () => {
      console.log(`Port ${port} is free`);
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function test() {
  await checkPort(5000);
  await checkPort(5001);
  await checkPort(5005);
}

test();
