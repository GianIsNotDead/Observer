const SerialPort = require('serialport');
const fs = require('fs');

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
  let eegData = {status: null, val: [], time: null};
  let eegDataRaw = arr.slice(1, arr.length);
  let statusData = eegDataRaw.slice(0, 3).join('');
  let channelData = new Uint32Array((eegDataRaw.length / 3) - 1);
  let currentChannel = 0;
  eegDataRaw.slice(3, eegDataRaw.length).forEach((d, idx) => {
    if (idx >= 3 && idx % 3 === 0) {
      let masked = channelData[currentChannel] & 0x00FFFFFF;
      eegData.val.push(Number(func(masked).toFixed(6)));
      currentChannel = currentChannel + 1;
    }
    channelData[currentChannel] = (channelData[currentChannel] << 8) | d;
  });
  eegData.status = statusData;
  eegData.time = new Date().toUTCString();
  return eegData;
};

let portData = {
  dataType: null,
  data: null,
  size: 0, // total size expected from the device
  _makeDataContainer() {
    this.data = this.size === 0 ? null : new Uint8Array(this.size);
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
  read(buff) {
    let processedData = null;
    let byteArr = new Uint8Array(buff);
    if (this.data === null) {
      console.log('setting data ---------------->');
      this.size = byteArr[0];
      this._makeDataContainer();
    }
    byteArr.forEach((byte) => {
      this.data[this.data.length - this.size] = byte;
      this.size = this.size - 1;
    });
    if (this.size === 0 && this.dataType === 'device-data') {
      console.log('finished reading device data ---------------->');
      processedData = processDeviceData(this.data);
      this.data = null;
    }
    if (this.size === 0 && this.dataType === 'eeg') {
      console.log('finished reading eeg data ---------------->');
      processedData = processEEGData(this.data);
      this.data = null;
    }
    if (processedData === null) {
      return new Promise(resolve => resolve([]));
    }
    return new Promise(resolve => resolve([this.dataType, processedData]));
  },
};

/******************************
 * Command Line Interface
******************************/
if (process.argv.length > 2) {
  // For future use when able to export multiple file format
  let format = process.argv[2];
  let duration = parseInt(process.argv[3]) + 2000;
  let JSONFormat = {deviceData: null, eegData: []};
  port.open(() => console.log('Device Connected'));
  // Device need time to settle
  setTimeout(() => portData.requestData('device-data'), 1500);
  setTimeout(() => portData.requestData('eeg'), 2000);
  // TODO: make sure promise is executed successfully
  port.on('data', (buff) => {
    portData.read(b)
      .then(d => {
        if (d.length === 0) return;
        if (d[0] === 'device-data') JSONFormat.deviceData = d[1];
        if (d[0] === 'eeg') JSONFormat.eegData.push(d[1]);
      });
  });
  setTimeout(() => {
    port.close(() => console.log('Serial port closed...'));
    if (format === 'JSON' || format === 'json') {
      let fileName = new Date().toUTCString().split(' ').slice(1, 5).join('-');
      let JSONContent = JSON.stringify(JSONFormat);
      fs.writeFile(`./storage/${fileName}.json`, JSONContent, 'utf-8', () => {
        console.log('complete');
      });
    }
  }, duration);
}

/******************************
 * Web Socket Interface
******************************/
module.exports = portData;
