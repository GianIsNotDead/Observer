const SerialPort = require('serialport');

console.log('process.argv', process.argv);

const port = new SerialPort('/dev/cu.usbmodem14501', {
  baudRate: 9600,
});

const checkData = (data, timeOut = 5000) => {
  return new Promise(resolve => {
    let checkData = setInterval(() => {
      if (data !== null && data !== undefined) {
        clearInterval(checkData)
        resolve(data);
      }
    }, 1);
    setTimeout(() => {
      clearInterval(checkData);
      resolve();
    }, timeOut);
  });
};

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
}

const processEEGData = (arr, func = convertADC) => {
  let eegData = {status: null, val: [], time: null};
  let eegDataRaw = arr.slice(1, arr.length);
  let statusData = eegDataRaw.slice(0, 3).join('');
  let channelData = new Uint32Array((eegDataRaw.length / 3) - 1);
  let currentChannel = 0;
  eegDataRaw.slice(3, eegDataRaw.length).forEach((d, idx) => {
    if (idx >= 3 && idx % 3 === 0) {
      let mask = channelData[currentChannel] & 0x00FFFFFF;
      channelData[currentChannel] = mask;
      eegData.val.push(Number(func(mask).toFixed(6)));
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
  makeDataContainer() {
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
  store(buff) {
    let byteArr = new Uint8Array(buff);
    if (this.data === null) {
      this.size = byteArr[0];
      this.makeDataContainer();
    }
    byteArr.forEach((byte) => {
      this.data[this.data.length - this.size] = byte;
      this.size = this.size - 1;
    });
    if (this.size === 0 && this.dataType === 'device-data') {
      let deviceData = processDeviceData(this.data);
      console.log('deviceData: ', deviceData);
      this.data = null;
      return deviceData;
    }
    if (this.size === 0 && this.dataType === 'eeg') {
      let eegData = processEEGData(this.data);
      console.log('eegData: ', eegData);
      this.data = null;
      return eegData;
    }
  },
};

// This event is triggered whenever there's data coming in from the serial port
port.on('data', function (buff) {
  portData.store(buff);
});

port.on('open', () => {
  console.log('port opened...');
  setTimeout(() => {
    portData.requestData('device-data');
    setTimeout(() => {
      portData.requestData('eeg');
    }, 2000);
  }, 2000);
});

module.exports = portData;
