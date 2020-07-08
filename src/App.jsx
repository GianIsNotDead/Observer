import React, { Component } from 'react';

// Component
import Console from './Console';
import Channel from './Channel';
import Controls from './Controls';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deviceCharacteristic: null,
      channelCharacteristic: null,
      mockData: [0.5, -0.5, 1.5, -1.5, 2.5, -2.5, 3.5, -3.5, 4.5, -4.5, 5.5, -5.5, 6.5, -6.5, 7.5, -7.5, 8.5, -8.5, 9.5, -9.5,],
      deviceData: null,
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

  handleButtonPress(btn) {
    let ws = new WebSocket('ws://localhost:9001');
    ws.addEventListener('open', () => ws.send('hello'));
    ws.addEventListener('message', (msg) => {
      let { data } = msg;
      if (data.match(/device-data/g) !== null) {
        let deviceData = data.substring(data.indexOf('{'), data.length - 1);
        this.setState({ deviceData });
      }
    });
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
      let newState = true;
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
  
  render() {
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
          <Channel
            channelNumber="1"
            mockData={this.state.mockData}
            displayPointCircle={this.state.displayPointCircle}
            toggleElement={this.toggleElement}
            getMouseXPosition={this.getMouseXPosition}
            mouseXPosition={this.state.mouseXPosition}
            getAmpGraphXPosition={this.getAmpGraphXYPosition}
            ampGraphXPosition={this.state.ampGraphXPosition}
            ampGraphYPosition={this.state.ampGraphYPosition}
          />
          <Channel
            channelNumber="2"
            mockData={this.state.mockData}
            displayPointCircle={this.state.displayPointCircle}
            toggleElement={this.toggleElement}
            getMouseXPosition={this.getMouseXPosition}
            mouseXPosition={this.state.mouseXPosition}
          />
          <Channel
            channelNumber="3"
            mockData={this.state.mockData}
            displayPointCircle={this.state.displayPointCircle}
            toggleElement={this.toggleElement}
            getMouseXPosition={this.getMouseXPosition}
            mouseXPosition={this.state.mouseXPosition}
          />
          <Channel
            channelNumber="4"
            mockData={this.state.mockData}
            displayPointCircle={this.state.displayPointCircle}
            toggleElement={this.toggleElement}
            getMouseXPosition={this.getMouseXPosition}
            mouseXPosition={this.state.mouseXPosition}
          />
          <Channel
            channelNumber="5"
            mockData={this.state.mockData}
            displayPointCircle={this.state.displayPointCircle}
            toggleElement={this.toggleElement}
            getMouseXPosition={this.getMouseXPosition}
            mouseXPosition={this.state.mouseXPosition}
          />
          <Channel
            channelNumber="6"
            mockData={this.state.mockData}
            displayPointCircle={this.state.displayPointCircle}
            toggleElement={this.toggleElement}
            getMouseXPosition={this.getMouseXPosition}
            mouseXPosition={this.state.mouseXPosition}
          />
          <Channel
            channelNumber="7"
            mockData={this.state.mockData}
            displayPointCircle={this.state.displayPointCircle}
            toggleElement={this.toggleElement}
            getMouseXPosition={this.getMouseXPosition}
            mouseXPosition={this.state.mouseXPosition}
          />
          <Channel
            channelNumber="8"
            mockData={this.state.mockData}
            displayPointCircle={this.state.displayPointCircle}
            toggleElement={this.toggleElement}
            getMouseXPosition={this.getMouseXPosition}
            mouseXPosition={this.state.mouseXPosition}
          />
        </section>
      </section>
    );
  }
}

export default App;
