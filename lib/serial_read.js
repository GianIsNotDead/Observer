const SerialPort = require('serialport');
const port = new SerialPort('/dev/cu.usbmodem14601', { baudRate: 9600 });

port.on('data', function (data) {
  let buff = new Buffer(data, 'base64');
  let text = buff.toString('ascii');
  console.log('Data:', text)
});
