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
      // { total_channels, data_rate, clock, reference, bias_enabled, test_passed }
      deviceData: null,
      eegData: [],
      // UI state
      yScale: 20,
      ampGraphXPosition: 0,
      ampGraphYPosition: 0,
      ampValue: 0,
    };
    this.getAmpGraphXYPosition = this.getAmpGraphXYPosition.bind(this);
    this.toggleElement = this.toggleElement.bind(this);
    this.scaleYAxis = this.scaleYAxis.bind(this);
    this.handleButtonPress = this.handleButtonPress.bind(this);
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

  // Y axis height division, i.e 10 means the positive and negative coordinates are divided in to 10 points.
  scaleYAxis() {
    let { yScale, eegData } = this.state;
    let scaleFactor = 0.2;
    let yScaleCompare = eegData.length === 0 ? yScale : Math.abs(eegData[0][eegData.length - 1]);
    console.log('Scalling y axis: ', yScale, ' yScaleCompare: ', yScaleCompare);
    if (yScaleCompare > yScale) {
      this.setState({ yScale: Math.ceil(yScale + (scaleFactor * yScaleCompare)) });
    } else if ((scaleFactor * yScaleCompare + yScaleCompare) < yScale) {
      this.setState({ yScale: Math.ceil(yScale - (scaleFactor * yScaleCompare)) });
    }
  }

  handleButtonPress() {
    console.log('handling button press......');
    this.ws.send(' ');
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
    this.ws.addEventListener('message', (msg) => {
      let { data } = msg;
      if (data.match(/device-data/g) !== null) {
        let deviceData = data.substring(data.indexOf('{'), data.length - 1);
        this.setState({ deviceData });
      }
      if (data.match(/eeg/g) !== null) {
        let { eegData } = this.state;
        let eegStream = JSON.parse(data)[1].val;
        eegStream.forEach((d, n) => {
          if (!eegData[n]) eegData[n] = [];
          // TODO: Display in uV scale
          eegData[n].push(d * 1000);
        });
        this.setState({ eegData }, () => {
          console.log('eegData: ', eegData);
          this.scaleYAxis();
          // Reduce memory load.
          if (eegData[0].length < 180) return;
          let newData = eegData.map(d => d.slice(30, d.length));
          this.setState({ eegData: newData });
        });
      }
    });
  }

  render() {
    let ChannelComp = null;
    if (this.state.eegData.length !== 0) {
      ChannelComp = this.state.eegData.map((d, n) => {
        return (<Channel channelNumber={n + 1} eegData={d} yScale={this.state.yScale} scaleYAxis={this.scaleYAxis} />);
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
