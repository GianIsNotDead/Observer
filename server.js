const fs = require('fs');
const fastify = require('fastify')({
  logger: true
});

// Serve static files
fastify.get('/', (request, reply) => {
  // reply.send({ hello: 'world' });
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

// Run the server!
fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
});