const fs = require('fs');

const portData = require('./lib/serial_read');

const fastify = require('fastify')({
  logger: true
});

// Serve static files
fastify.get('/', (request, reply) => {
  const stream = fs.createReadStream('./index.html')
  reply.type('text/html').send(stream)
});
fastify.get('/dist/*', (request, reply) => {
  let fileName = request.params['*'];
  let fileType = null;
  if (fileName.lastIndexOf('.js') !== -1) {
    fileType = 'text/javascript';
  }
  if (fileName.lastIndexOf('.css') !== -1) {
    fileType = 'text/css';
  }
  const stream = fs.createReadStream(`./dist/${fileName}`);
  reply.type(fileType).send(stream);
});

// Serve data from serial port
fastify.get('/device-data', (request,reply) => {
  console.log('getting device data ......');
  portData.getData('device-data')
    .then(data => reply.send(data));
});

// Run the server!
fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
});