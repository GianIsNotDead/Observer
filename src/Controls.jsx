import React from 'react';

function Controls({ handleButtonPress }) {
  return (
    <div className="controls">
      <button className="start-btn" name="start-btn" onClick={handleButtonPress}>Start</button>
    </div>
  );
}

export default Controls;
