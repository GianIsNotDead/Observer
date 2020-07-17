const SerialPort = require('serialport');
const fs = require('fs');
let path = require('path');

// TODO: add port detection and selection
const port = new SerialPort('/dev/cu.usbmodem14501', {
  baudRate: 9600,
  autoOpen: false,
});

// TODO: display dynamic value after adding feature to allow adjustments of the device setting
const processDeviceData = (arr) => {
  return {
    total_channels: arr[1],
    data_rate: (arr[3] & 0x06) === 0x06 ? 250 : 0,
    clock: 'internal',
    reference: (arr[4] & 0x80) ===  0x80 ? 'internal' : '',
    bias_enabled: (arr[4] & 0x04) === 0x04 ? true : false,
    test_passed: arr[5] === 1 ? true : false,
  };
};

const convertADC = (data) => {
  let lsb = (2 * 4.5 / 24) / (Math.pow(2, 24));
  let maxValue = Math.pow(2, 23) - 1;
  if (data > maxValue) {
    let negativeValue = data - maxValue - 1;
    return (negativeValue - Math.pow(2, 23)) * lsb;
  }
  return data * lsb;
};

// Aggregate hex value from device, convert value to voltage, and create time series
const processEEGData = (arr, func = convertADC) => {
  let eegData = {status: null, val: [], time: new Date().toUTCString()};
  let eegDataRaw = arr.slice(1, arr.length);
  let statusData = eegDataRaw.slice(0, 3).join('');
  let channelData = new Uint32Array((eegDataRaw.length / 3) - 1);
  let currentChannel = 0;
  eegDataRaw.slice(3, eegDataRaw.length).forEach((d, idx) => {
    channelData[currentChannel] = (channelData[currentChannel] << 8) | d;
    if ((idx + 1) % 3 === 0) {
      let masked = channelData[currentChannel] & 0x00FFFFFF;
      eegData.val.push(Number(func(masked).toFixed(6)));
      currentChannel = currentChannel + 1;
    }
  });
  eegData.status = statusData;
  return eegData;
};

let portData = {
  dataType: null,
  data: null,
  size: 0, // total size expected from the device
  _makeDataContainer(size) {
    this.size = size;
    this.data = new Uint8Array(size);
  },
  requestData(type) {
    if (type === 'device-data') {
      port.write(Buffer.from('00', 'hex'));
      this.dataType = 'device-data';
    }
    if (type === 'eeg') {
      port.write(Buffer.from('01', 'hex'));
      this.dataType = 'eeg';
    }
  },
  stopData() {
    port.write(Buffer.from('02', 'hex'));
  },
  read(buff) {
    let processedData = null;
    buff.forEach((byte) => {
      if (this.data === null) {
        this._makeDataContainer(byte);
      }
      this.data[this.data.length - this.size] = byte;
      this.size = this.size - 1;
      if (this.size === 0 && this.dataType === 'device-data') {
        processedData = processDeviceData(this.data);
        this.data = null;
      }
      if (this.size === 0 && this.dataType === 'eeg') {
        processedData = processEEGData(this.data);
        this.data = null;
      }
    });
    if (processedData === null) {
      return [];
    }
    return [this.dataType, processedData];
  },
};

/******************************
 * Command Line Interface
******************************/
if (process.argv.length === 4 && process.argv[2].match(/json|JSON/g) !== null) {
  let fileFormat = process.argv[2];
  // For future use when able to export multiple file format
  let duration = parseInt(process.argv[3]) + 2000;
  let JSONFormat = {deviceData: null, eegData: []};
  port.open(() => console.log('Device Connected'));
  // Device need time to settle
  setTimeout(() => portData.requestData('device-data'), 1500);
  setTimeout(() => portData.requestData('eeg'), 2000);
  port.on('data', (buff) => {
    let formatedData = portData.read(buff);
    if (formatedData.length !== 0 && formatedData[0] === 'device-data'){
      JSONFormat.deviceData = formatedData[1];
    }
    if (formatedData.length !== 0 && formatedData[0] === 'eeg') {
      JSONFormat.eegData.push(formatedData[1]);
    }
  });
  setTimeout(() => {
    port.close(() => console.log('Serial port closed...'));
    let fileName = new Date().toUTCString().split(' ').slice(1, 5).join('-');
    let JSONContent = JSON.stringify(JSONFormat);
    fs.writeFile(path.resolve(`./storage/${fileName}.${fileFormat.toLowerCase()}`), JSONContent, 'utf-8', () => console.log('complete'));
  }, duration);
}

/******************************
 * Web Socket Interface
******************************/
if (process.argv.length === 2) {
  portData.openPort = function() {
    port.open();
  }
  portData.handleDataEvent = function(func) {
    port.on('data', (buff) => {
      let formatedData = portData.read(buff);
      if (formatedData.length !== 0) {
        func(formatedData);
      }
    });
  };
  module.exports = portData;
}
