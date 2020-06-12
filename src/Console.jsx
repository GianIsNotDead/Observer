import React from 'react';

function Console({ data, formatConsoleData }) {
  let d = formatConsoleData(data);
  return (
    <div className="console">
      <p>{ d }</p>
    </div>
  );
}

export default Console;
