const uWS = require('uWebSockets.js');
const readSerial = require('./readSerial.js');

const EEG = new readSerial();
const port = 9001;

const arrBuffToStr = (buffer) => {
  var arr = new Uint8Array(buffer);
  var str = String.fromCharCode.apply(String, arr);
  return str;
};

const throttle = (func, delay) => {
  let timeBefore = Date.now();
  let bufferContainer = [];
  return (data) => {
    let timePassed = Date.now() - timeBefore;
    bufferContainer.push(data);
    if (delay - timePassed > 0) return;
    timeBefore = Date.now();
    func(bufferContainer);
    bufferContainer = [];
  };
}

const app = uWS.App().ws('/*', {
  compression: uWS.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  // idleTimeout: 10,
  open: (ws) => {
    console.log('A WebSocket connected!');
    ws.subscribe('sensors/#');
  },
  message: (ws, message, isBinary) => {
    let sendData = null;
    if (arrBuffToStr(message) === 'start') {
      sendData = throttle((data) => {
        ws.publish('sensors/eeg', JSON.stringify(data));
      }, 150);
      EEG.start(data => sendData(data));
    }
    if (arrBuffToStr(message) === 'stop') {
      EEG.stop();
      sendData = null;
    }
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
