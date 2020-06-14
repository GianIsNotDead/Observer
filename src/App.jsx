import React, { Component } from 'react';

// Component
import Console from './Console';
import Channel from './Channel';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deviceCharacteristic: null,
      channelCharacteristic: null,
      mockData: [0.5, -0.5, 1.5, -1.5, 2.5, -2.5, 3.5, -3.5, 4.5, -4.5, 5.5, -5.5, 6.5, -6.5, 7.5, -7.5, 8.5, -8.5, 9.5, -9.5,],
      data: JSON.stringify([
        {
          device_id: 0x00111110,
          data_rate: 250,
          clock: 'internal',
          reference: 'internal'
        },
        {
          ch_number: 1,
          mode: 'single ended',
          driver: 'p',
          bias_n: true,
          bias_p: true
        },
        {
          ch_number: 2,
          mode: 'single ended',
          driver: 'p',
          bias_n: true,
          bias_p: true
        },
      ]),
    };
    this.formatConsoleData = this.formatConsoleData.bind(this);
  }

  componentDidMount() {
    let cur = 0;
    let cloneData = this.state.mockData;
    let that = this;
    setInterval(function(){
      if (cloneData.length > 150) {
        cloneData = cloneData.slice(75, cloneData.length);
      }
      let mockVoltage = Math.floor((Math.random() * 10) + 1);
      if (cur % 2 === 0) {
        mockVoltage = mockVoltage - 10;
      }
      cloneData.push(mockVoltage);
      that.setState({ mockData: cloneData }, () => {
        cur = cur + 1;
      });
    }, 100);
  }

  /**
   * @param {string} data
   * @returns {string}
   * @description format string data from the serial port
  */
  formatConsoleData(data) {
    let formatedData = '';
    for (let i = 0; i < data.length; i += 1) {
      // concat all alphabet charaters, numbers and spaces and colons
      if (data[i].match(/([A-Za-z1-9]|"|\s|_)/) !== null) {
        formatedData = formatedData.concat(data[i]);
      }
      if (data[i] === '{') {
        formatedData = formatedData.concat(data[i]).concat('\n    ');
      }
      if (data[i] === '}') {
        formatedData = formatedData.concat('\n').concat(data[i]).concat('\n\n');
      }
      if (data[i] === ',' && data[i + 1] !== '{') {
        formatedData = formatedData.concat(data[i]).concat('\n    ');
      }
      if (data[i] === ':') {
        formatedData = formatedData.concat(data[i]).concat(' ');
      }
    }
    return formatedData;
  }

  render() {
    return (
      <section className="panel-container">
        <section className="left-panel">
          <Console
            data={this.state.data}
            formatConsoleData={this.formatConsoleData}
          />
        </section>
        <section className="right-panel">
          <Channel mockData={this.state.mockData} />
        </section>
      </section>
    );
  }
}

export default App;
