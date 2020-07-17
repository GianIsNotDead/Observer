import React, { Component } from 'react';

// Component
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
      ampGraphXPosition: 0,
      ampGraphYPosition: 0,
      ampValue: 0,
    };
    this.getAmpGraphXYPosition = this.getAmpGraphXYPosition.bind(this);
    this.toggleElement = this.toggleElement.bind(this);
    this.handleButtonPress = this.handleButtonPress.bind(this);
    this.debounceData = this.debounceData.bind(this);
    this.lowPassFilter = this.lowPassFilter.bind(this);
  }

  getAmpGraphXYPosition(newXPosition, newYPosition) {
    this.setState({
      ampGraphXPosition: newXPosition,
      ampGraphYPosition: newYPosition,
    });
  }

  toggleElement(stateProperty) {
    let newState = false;
    if (this.state[stateProperty] === newState) {
      newState = true;
    }
    this.setState({ [stateProperty]: newState });
  }

  handleButtonPress() {
    console.log('handling button press......');
    this.ws.send(' ');
  }

  debounceData(t) {
    let container = [];
    // |
    // |  Closure function, set state at a predefined interval
    // v
    return (data) => {
      // [ 0.013317, 0.013315, 0.013334, 0.013325, 0.013315, 0.013324, 0.013323 ]
      let eegStream = JSON.parse(data)[1].val;
      eegStream.forEach((d, idx) => {
        if (container[idx] === undefined) {
          container[idx] = [];
          this.setState({ yScale: this.state.yScale.concat(200) });
        }
        // free memory
        let mV = d * 1000;
        // value in mV scale
        container[idx].push(mV);
      });
      setTimeout(() => {
        this.setState({ eegData: container }, () => {
          if (container[0].length > 204) {
            container = container.map((c, idx) => {
              let { yScale } = this.state;
              yScale[idx] = c.slice(c.length - 68, c.length).reduce((acc, cur) => Math.ceil(Math.max(acc, cur)));
              this.setState({ yScale });
              return c.slice(c.length - 170, c.length);
            });
          }
        });
      }, t);
    };
  }

  // TODO: complete filter for main's noise interference
  lowPassFilter(samples, cutoff, sampleRate) {
    let rc = 1.0 / (cutoff * 2 * Math.PI);
    let dt = 1.0 / sampleRate;
    let alpha = dt / (rc + dt);
  }

  componentWillUnmount() {
    this.ws.removeEventListener('open');
    this.ws.removeEventListener('message');
    this.ws.close();
  }
  
  componentDidMount() {
    // TODO: check connection status, and re-establish connection if necessary
    this.ws = new WebSocket('ws://localhost:9001');
    this.ws.addEventListener('open', () => this.setState({ wsOpened: true }));
    this.ws.addEventListener('close', () => console.log('web socket closed'));
    // Incoming Data
    let processMessage = this.debounceData(1000);
    this.ws.addEventListener('message', (msg) => {
      let { data } = msg;
      if (data.match(/device-data/g) !== null) {
        let deviceData = data.substring(data.indexOf('{'), data.length - 1);
        this.setState({ deviceData });
      }
      if (data.match(/eeg/g) !== null) {
        processMessage(data);
      }
    });
  }

  render() {
    let ChannelComp = null;
    if (this.state.eegData.length !== 0) {
      ChannelComp = this.state.eegData.map((d, n) => {
        return (<Channel channelNumber={n + 1} eegData={d} yScale={this.state.yScale[n]} />);
      });
    }
    return (
      <section className="panel-container">
        <section className="left-panel">
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
