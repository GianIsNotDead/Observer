import React from 'react';

/**
 * @param {string} data
 * @returns {string}
 * @description format string data from the serial port
*/

let _formatConsoleData = (data) => {
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
};

function Console({ deviceData }) {
  return (
    <div className="console">
      <p>{ deviceData === null ? '' : _formatConsoleData(deviceData) }</p>
    </div>
  );
}

export default Console;
