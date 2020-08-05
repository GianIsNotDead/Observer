import React from 'react';

function Ports({ ports, selectedPort, togglePortSelection, toggleElement, handleButtonPress }) {
  const PortsComp = ports !== null ? ports.map((p, idx) => (
    <button className="available-port" key={`port-btn-${idx}`} onClick={handleButtonPress} name={`selected_port:${p.path}`}>{p.path}</button>
  )) : null;
  return (
    <div className="ports">
      <p className="current-port">{`Current Port: ${selectedPort === null ? '' : selectedPort}`}</p>
      <button
        className="select-port"
        onClick={() => toggleElement('togglePortSelection')}
      >V</button>
      { togglePortSelection === true &&
        <div className="dropdown-select">
          {PortsComp}
        </div>
      }
    </div>
  );
};

export default Ports;
