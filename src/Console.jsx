import React from 'react';

function Console({ deviceData, formatConsoleData }) {
  return (
    <div className="console">
      <p>{ formatConsoleData(deviceData) }</p>
    </div>
  );
}

export default Console;
