import React, { Component } from 'react';

// Component
import Ports from './Ports';
import Console from './Console';
import Channel from './Channel';
import Controls from './Controls';

class App extends Component {
  constructor(props) {
    super(props);
    this.ws = null;
    this.state = {
      wsOpened: false,
      // {"total_channels":8,"data_rate":0,"clock":"internal","reference":"internal","bias_enabled":true,"test_passed":true}
      deviceData: null,
      // [ {"status":"19200","val":[0.013317,0.013315,0.013334,0.013325,0.013315,0.013324,0.013323],"time":"Tue, 14 Jul 2020 16:59:58 GMT"} ]
      eegData: [],
      // UI state
      yScale: [],
      togglePortSelection: false,
      ports: null,
    };
    this.toggleElement = this.toggleElement.bind(this);
    this.handleButtonPress = this.handleButtonPress.bind(this);
    this.processEEGData = this.processEEGData.bind(this);
    this.lowPassFilter = this.lowPassFilter.bind(this);
  }

  toggleElement(stateProperty) {
    let newState = false;
    if (this.state[stateProperty] === newState) {
      newState = true;
    }
    this.setState({ [stateProperty]: newState });
  }

  handleButtonPress(btn) {
    let command = btn.target.name;
    console.log('This is command: ', command);
    this.ws.send(command);
  }

  processEEGData(data) {
    let { eegData } = this.state
    // Manage memory
    if (eegData[0] !== undefined && eegData[0].length > 204) {
      eegData = eegData.map((d, idx) => {
        let { yScale } = this.state;
        yScale[idx] = d.slice(d.length - 68, d.length).reduce((acc, cur) => Math.ceil(Math.max(Math.abs(acc), Math.abs(cur))));
        this.setState({ yScale });
        return d.slice(d.length - 170, d.length);
      });
    }
    let eegStream = data.val;
    eegStream.forEach((d, idx) => {
      if (eegData[idx] === undefined) {
        eegData[idx] = [];
        this.setState({ yScale: this.state.yScale.concat(200) });
      }
      // value in mV scale
      let mV = d * 1000;
      eegData[idx].push(mV);
    });
    this.setState({ eegData });
  }

  // TODO: complete filter for main's noise interference
  lowPassFilter(samples, cutoff, sampleRate) {
    let rc = 1.0 / (cutoff * 2 * Math.PI);
    let dt = 1.0 / sampleRate;
    let alpha = dt / (rc + dt);
  }

  componentWillUnmount() {
    if (this.state.wsOpened === true) this.ws.close();
  }
  
  componentDidMount() {
    // TODO: check connection status, and re-establish connection if necessary
    this.ws = new WebSocket('ws://localhost:9001');
    this.ws.addEventListener('open', () => {
      this.setState({ wsOpened: true });
      this.ws.send('get_port');
    });
    this.ws.addEventListener('close', () => {
      this.setState({ wsOpened: false });
    });
    // Incoming Data
    this.ws.addEventListener('message', (msg) => {
      let { data } = msg;
      JSON.parse(data).forEach(d => {
        if (d[0].match(/ports/g) !== null) {
          this.setState({ ports: d[1] });
        }
        if (d[0].match(/device/g) !== null) {
          this.setState({ deviceData: JSON.stringify(d[1]) });
        }
        if (d[0].match(/eeg/g) !== null) {
          this.processEEGData(d[1]);
        }
      });
    });
  }

  render() {
    let ChannelComp = null;
    if (this.state.eegData.length !== 0) {
      ChannelComp = this.state.eegData.map((d, n) => {
        return (<Channel channelNumber={n + 1} eegData={d} yScale={this.state.yScale[n]} key={`channel${n}`} />);
      });
    }
    return (
      <section className="panel-container">
        <section className="left-panel">
          <Ports
            ports={this.state.ports}
            togglePortSelection={this.state.togglePortSelection}
            toggleElement={this.toggleElement}
          />
          <Console
            deviceData={this.state.deviceData}
            formatConsoleData={this.formatConsoleData}
          />
          <Controls
            handleButtonPress={this.handleButtonPress}
          />
        </section>
        <section className="right-panel">
          { ChannelComp !== null && ChannelComp }
        </section>
      </section>
    );
  }
}

export default App;
