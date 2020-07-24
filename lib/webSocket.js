const uWS = require('uWebSockets.js');
const portData = require('./serial_read');

const port = 9001;

const arrBuffToStr = (buffer) => {
  var arr = new Uint8Array(buffer);
  var str = String.fromCharCode.apply(String, arr);
  return str;
};

// TODO: fix missing/mis sorted data
const throttle = (func, delay) => {
  let timeBefore = Date.now();
  let bufferContainer = [];
  return (data) => {
    let timePassed = Date.now() - timeBefore;
    if (delay - timePassed < 0) {
      console.log('time remained: ', timePassed);
      timeBefore = Date.now();
      return func(data);
    }
    bufferContainer.push(data);
    let timeout = setTimeout(() => {
      console.log('delaying...');
      if (bufferContainer.length !== 0) func(bufferContainer);
      clearTimeout(timeout);
      bufferContainer = [];
      timeBefore = Date.now();
    }, delay - timePassed);
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
    console.log(arrBuffToStr(message));
    if (arrBuffToStr(message) === 'start') {
      let t = throttle((data) => {
        ws.publish('sensors/eeg', JSON.stringify(data));
      }, 1000);
      portData.openPort();
      setTimeout(() => portData.requestData('device-data'), 1500);
      setTimeout(() => portData.requestData('eeg'), 3000);
      portData.handleDataEvent((val) => {
        console.log('val: ', val);
        t(val);
      });
    }
    if (arrBuffToStr(message) === 'stop') {
      portData.stopData();
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
