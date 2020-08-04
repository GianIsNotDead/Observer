const SerialPort = require('serialport');
const fs = require('fs');
const path = require('path');
// Device Command
const getDeviceData = Buffer.from('00', 'hex');
const getEEGData = Buffer.from('01', 'hex');
const stopData = Buffer.from('02', 'hex');

class ReadSerial {
  constructor() {
    this.dataType = null;
    this.data = null;
    this.size = 0;
    this.devicePath = '/dev/cu.usbmodem14501';
    this.port = null;
  }

  /*******************************
   * Public
  *******************************/
  getPort = (func) => {
    SerialPort.list().then(ports => func(ports));
  }

  start = (getDataFunc) => {
    this.port = new SerialPort(this.devicePath, {
      baudRate: 9600,
      autoOpen: false,
    });
    this.port.open(() => {
      this._triggerEvent(getDataFunc);
      // Allow device to power up
      setTimeout(() => { this._requestData('device') }, 1500);
      setTimeout(() => { this._requestData('eeg') }, 2000);
    });
  }

  stop = () => {
    this.port.write(stopData);
    this.port.close(() => {
      this.dataType = null;
      this.data = null;
      this.size = 0;
      // Remove duplicate event listener
      this.port = null;
    });
  }

  /*******************************
   * Private
  *******************************/
  /**
   * @description reset properties after raw data is processed
   * @param {Number} dataSize the size of data indicated at the begining of the stream
  */
  _resetDataContainer = (dataSize) => {
    this.size = dataSize;
    this.data = new Uint8Array(dataSize);
  }

  // Send commands to microcontroller
  _requestData = (type) => {
    let command = null;
    if (type === 'device') command = getDeviceData;
    if (type === 'eeg') command = getEEGData;
    this.dataType = type;
    this.port.write(command);
  }

  // Aggregate individual segment of the stream based on the size indicated
  _readData = (buff) => {
    // Ignore cached serial data
    if (this.data === null && (buff[0] > 6) && this.dataType === null) return [];
    let processedData = null;
    buff.forEach((byte) => {
      if (this.data === null) {
        this._resetDataContainer(byte);
      }
      this.data[this.data.length - this.size] = byte;
      this.size = this.size - 1;
      if (this.size === 0 && this.dataType === 'device') {
        processedData = this._processDeviceData(this.data);
        this.data = null;
      }
      if (this.size === 0 && this.dataType === 'eeg') {
        processedData = this._processEEGData(this.data);
        this.data = null;
      }
    });
    if (processedData === null) return [];
    return [this.dataType, processedData];
  }

  _triggerEvent = (getDataFunc, processBuffer = this._readData) => {
    this.port.on('data', (buff) => {
      let dataRead = processBuffer(buff);
      if (dataRead.length === 0) return;
      getDataFunc(dataRead);
    });
  }

  /**
   * @description 3 bytes to voltage conversion in 2's compliment
   * @param {Number} data 3 bytes of aggregated channel data
  */
  _convertADC = (data) => {
    const lsb = (2 * 4.5 / 24) / (Math.pow(2, 24));
    let maxValue = Math.pow(2, 23) - 1;
    // Convert to negative number
    if (data > maxValue) {
      let negativeValue = data - maxValue - 1;
      return (negativeValue - Math.pow(2, 23)) * lsb;
    }
    // return positive number
    return data * lsb;
  }

  _processDeviceData = (arr) => {
    return {
      total_channels: arr[1],
      data_rate: (arr[3] & 0x06) === 0x06 ? 250 : 0,
      clock: 'internal',
      reference: (arr[4] & 0x80) ===  0x80 ? 'internal' : '',
      bias_enabled: (arr[4] & 0x04) === 0x04 ? true : false,
      test_passed: arr[5] === 1 ? true : false,
    };
  }

  /**
   * @description aggregate 3 bytes per channel
  */
  _processEEGData = (arr, func = this._convertADC) => {
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
  }
}

/*******************************
 * Command Line Interface
*******************************/
if (process.argv.length === 4 && process.argv[2].match(/json|JSON/g) !== null) {
  // For future use when able to export multiple file format
  let fileFormat = process.argv[2];
  let duration = parseInt(process.argv[3]) + 2000;
  let JSONFormat = {deviceData: null, eegData: []};

  let progressDots = '.........................';
  let startTime = Date.now();
  process.stdout.write('recording in progress: \n');
  
  let EEG = new ReadSerial();
  EEG.start((data) => {
    let dataType = data[0];
    let value = data[1];
    // Display progress on terminal
    let progress = (Date.now() - startTime) / duration;
    let percent = Math.floor(progress * 100);
    let dots = progressDots.substring(0, Math.floor(progressDots.length * progress));
    process.stdout.clearLine(1);
    process.stdout.cursorTo(1);
    process.stdout.write(`${dots}${percent}%`);
    // Aggregate JSON data
    if (dataType === 'device') JSONFormat.deviceData = value;
    if (dataType === 'eeg') JSONFormat.eegData.push(value);
  });

  setTimeout(() => {
    EEG.stop();
    let fileName = new Date().toUTCString().split(' ').slice(1, 5).join('-');
    let JSONContent = JSON.stringify(JSONFormat);
    fs.writeFile(path.resolve(`./storage/${fileName}.${fileFormat.toLowerCase()}`), JSONContent, 'utf-8', () => console.log('\nDone'));
  }, duration);
}

module.exports = ReadSerial;
