import React from 'react';

function Controls({ handleButtonPress }) {
  return (
    <div className="controls">
      <button className="start-btn" name="start" onClick={handleButtonPress}>Start</button>
      <button className="stop-btn" name="stop" onClick={handleButtonPress}>Stop</button>
    </div>
  );
}

export default Controls;
