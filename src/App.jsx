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
      deviceData: {},
      // UI state
      ampGraphXPosition: 0,
      ampGraphYPosition: 0,
      ampValue: 0,
    };
    this.handleButtonPress = this.handleButtonPress.bind(this);
    this.getAmpGraphXYPosition = this.getAmpGraphXYPosition.bind(this);
    this.toggleElement = this.toggleElement.bind(this);
    this.formatConsoleData = this.formatConsoleData.bind(this);
    this.generateDemoData = this.generateDemoData.bind(this);
  }

  handleButtonPress(btn) {
    console.log('button pressed');
    fetch('http://localhost:3000/')
      .then(response => console.log(response));
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

  componentDidMount() {
    fetch(`http://localhost:3000/device-data`)
      .then(response => response.text())
      .then(deviceData => this.setState({ deviceData }));
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
