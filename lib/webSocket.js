const uWS = require('uWebSockets.js');
const portData = require('./serial_read');
portData.openPort();

const port = 9001;

function arrBuffToStr(buffer){
  var arr = new Uint8Array(buffer);
  var str = String.fromCharCode.apply(String, arr);
  return str;
}

const app = uWS.App().ws('/*', {
  compression: uWS.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 10,
  open: (ws) => {
    console.log('A WebSocket connected!');
    ws.subscribe('sensors/#');
  },
  message: (ws, message, isBinary) => {
    console.log('message: ', message);
    setTimeout(() => portData.requestData('device-data'), 1500);
    setTimeout(() => portData.requestData('eeg'), 3000);
    portData.handleDataEvent((val) => {
      ws.publish('sensors/eeg', JSON.stringify(val));
    });
    // setTimeout(() => portData.stopData(), 10000);
  },
  drain: (ws) => {
    console.log('WebSocket backpressure: ' + ws.getBufferedAmount());
  },
  close: (ws, code, message) => {
    console.log('WebSocket closed');
  }
}).any('/*', (res, req) => {
  res.end('Nothing to see here!');
}).listen(port, (token) => {
  if (token) {
    console.log('Listening to port ' + port);
  } else {
    console.log('Failed to listen to port ' + port);
  }
});
