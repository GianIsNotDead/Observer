import React from 'react';

function Ports({ ports, togglePortSelection, toggleElement }) {
  const PortsComp = ports !== null ? ports.map((p, idx) => (
    <button className="available-port" key={`port-btn-${idx}`}>{p.path}</button>
  )) : null;
  return (
    <div className="ports">
      <p className="current-port">Current Port: </p>
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
