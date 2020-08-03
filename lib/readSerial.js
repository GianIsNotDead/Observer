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
    this.port = new SerialPort(this.devicePath, {
      baudRate: 9600,
      autoOpen: false,
    });
  }

  start() {
    return new Promise(resolve => {
      this.port.open(() => resolve());
    });
  }

  requestData(type) {
    if (type !== 'device' || type !== 'eeg') {
      return new Error(`type must be 'device' or 'eeg', instead got ${type}`);
    }
    if (type === 'device') {
      this.port.write(getDeviceData);
    }
    if (type === 'eeg') {
      this.port.write(getEEGData);
    }
  }

  stop() {
    this.port.write(stopData);
  }

  readData(buff) {
    if (this.data === null && (buff[0] > 6) && this.dataType === null) {
      return [];
    };
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
  }

  _triggerEvent(func) {
    this.port.on('data', () => func);
  }

  /**
   * @description 3 bytes to voltage conversion in 2's compliment
  */
  _convertADC(data) {
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

  _processDeviceData(arr) {
    return {
      total_channels: arr[1],
      data_rate: (arr[3] & 0x06) === 0x06 ? 250 : 0,
      clock: 'internal',
      reference: (arr[4] & 0x80) ===  0x80 ? 'internal' : '',
      bias_enabled: (arr[4] & 0x04) === 0x04 ? true : false,
      test_passed: arr[5] === 1 ? true : false,
    };
  }

  _processEEGData(arr, func = this._convertADC) {
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

if (process.argv.length === 2) {
  module.export = ReadSerial;
}
