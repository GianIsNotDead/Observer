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

const processEEGData = (arr) => {

};

let portData = {
  dataType: null,
  data: [],
  size: 0,
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
    if (this.data.length === 0) {
      this.size = buff[0];
    }
    buff.forEach(b => this.data.push(b));
    if (this.data.length === this.size && this.dataType === 'device-data') {
      console.log(`this.data: ${this.data}`);
      let deviceData = processDeviceData(this.data);
      console.log('deviceData: ', deviceData);
      this.data = [];
      return deviceData;
    }
    if (this.data.length === this.size && this.dataType === 'eeg') {
      console.log('this.data.size: ', this.size, ' this.data.data: ', this.data);
      this.data = [];
    }
  },
};

// This event is triggered whenever there's data coming in from the serial port
port.on('data', function (data) {
  let buff = Buffer.from(data, 'hex');
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
