const uWS = require('uWebSockets.js');
const readSerial = require('./readSerial.js');

const EEG = new readSerial();
const port = 9001;

// Decode incoming buffer to string
const arrBuffToStr = (buffer) => {
  var arr = new Uint8Array(buffer);
  var str = String.fromCharCode.apply(String, arr);
  return str;
};

// Send data in a defined interval
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
    let msg = arrBuffToStr(message);
    console.log('msg: ', msg);
    let sendData = null;
    if (msg === 'get_port') {
      EEG.getPort((ports) => ws.publish('sensors/eeg', JSON.stringify([['ports', ports]])));
    }
    if (msg.match(/selected_port/g) !== null) {
      let path = msg.split(':')[1];
      EEG.selectPort(path, () => {
        ws.publish('sensors/eeg', JSON.stringify([['selected_port', path]]));
      });
    }
    if (msg === 'start') {
      sendData = throttle((data) => {
        ws.publish('sensors/eeg', JSON.stringify(data));
      }, 150);
      EEG.start(data => sendData(data));
    }
    if (msg === 'stop') {
      EEG.stop();
      sendData = null;
    }
  },
  drain: (ws) => {
    console.log('WebSocket backpressure: ' + ws.getBufferedAmount());
  },
  close: (ws, code, message) => {
    EEG.stop();
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
