const fs = require('fs');
const fastify = require('fastify')({ logger: true });
const { fork } = require('child_process');
const path = require('path');

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

fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`);
  fork(path.resolve('lib/webSocket.js'));
});
