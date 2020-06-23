const SerialPort = require('serialport');

const port = new SerialPort('/dev/cu.usbmodem14501', {
  baudRate: 9600,
});

let portData = {
  requestData(type) {
    if (type === 'device-data') {
      port.write(Buffer.from('C0', 'hex'));
    }
    return new Promise(resolve => {
      // TODO: prevent infinite execution when unable to retrieve data
      let checkData = setInterval(() => {
        console.log('this.data', this.data);
        if (this.data !== null && this.data !== undefined) {
          resolve(this.data);
          clearInterval(checkData);
          this.data = null;
        }
      }, 1);
    });
  },
  data: null,
};

const aggregateDeviceData = (data, arr) => {
  data.forEach(d => arr.push(d));
  if (arr.length === 1 ) {
    // TODO: allow more data rate read after user can select desired data rate
    return {
      total_channels: arr[4],
      data_rate: (arr[5] & 0x06) === 0x06 ? 250 : 0,
      clock: 'internal',
      reference: (arr[7] & 0x80) ===  0x80 ? 'internal' : '',
      bias_enabled: (arr[7] & 0x04) === 0x04 ? true : false,
      test_passed: arr[8] === 1 ? true : false,
    };
  }
};

const readData = (aggregateFunc) => {
  let aggregatedData = [];
  return (data) => {
    if (aggregatedData.length === 1) {
      aggregatedData = [];
    }
    return aggregateFunc(data, arr = aggregatedData);
  };
};

const processDeviceData = readData(aggregateDeviceData);

// This event is triggered whenever there's data coming in from the serial port
port.on('data', function (data) {
  let buff = Buffer.from(data, 'hex');
  portData.data = buff;
});

module.exports = portData;
