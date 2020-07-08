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
      mockData: [0.5, -0.5, 1.5, -1.5, 2.5, -2.5, 3.5, -3.5, 4.5, -4.5, 5.5, -5.5, 6.5, -6.5, 7.5, -7.5, 8.5, -8.5, 9.5, -9.5,],
      // { total_channels, data_rate, clock, reference, bias_enabled, test_passed }
      deviceData: null,
      eegData: [],
      // UI state
      ampGraphXPosition: 0,
      ampGraphYPosition: 0,
      ampValue: 0,
    };
    this.handleButtonPress = this.handleButtonPress.bind(this);
    this.getAmpGraphXYPosition = this.getAmpGraphXYPosition.bind(this);
    this.toggleElement = this.toggleElement.bind(this);
    this.generateDemoData = this.generateDemoData.bind(this);
  }

  handleButtonPress() {
    console.log('handling button press......');
    this.ws.send(' ');
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

  generateDemoData() {
    let cur = 0;
    let cloneData = this.state.mockData;
    let that = this;
    setInterval(function(){
      if (cloneData.length > 250) {
        cloneData = cloneData.slice(100, cloneData.length);
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

  componentWillUnmount() {
    this.ws.removeEventListener('open');
    this.ws.removeEventListener('message');
    this.ws.close();
  }
  
  componentDidMount() {
    this.ws = new WebSocket('ws://localhost:9001');
    this.ws.addEventListener('open', () => this.setState({ wsOpened: true }));
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
        this.setState({ eegData });
      }
      console.log('this.state.eegData: ', this.state.eegData);
    });
  }

  render() {
    let ChannelComp = null;
    if (this.state.eegData.length !== 0) {
      ChannelComp = this.state.eegData.map((d, n) => {
        return (<Channel channelNumber={n + 1} eegData={d}/>);
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
