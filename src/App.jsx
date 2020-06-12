import React, { Component } from 'react';

// Component
import Console from './Console';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
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

        </section>
      </section>
    );
  }
}

export default App;
