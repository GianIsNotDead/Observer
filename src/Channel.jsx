import React from 'react';

function Channel() {
  let mockData = [0.5, -0.5, 1.5, -1.5, 2.5, -2.5, 3.5, -3.5, 4.5, -4.5, 5.5, -5.5, 6.5, -6.5, 7.5, -7.5, 8.5, -8.5, 9.5, -9.5,];
  let previousValue = '';
  let xDistance = 10;
  let yMax = 120;
  let yMin = 0;
  let yMid = (yMax - yMin) / 2;
  let constructedGraph = mockData.map((a, x) => {
    let Path = null;
    if (x === 0) {
      Path = (<path d={`M${x*xDistance} ${yMid} L${x*xDistance + xDistance} ${yMid - (yMid / 10 * a)}`}></path>);
    }
    if (x !== 0) {
      Path = (<path d={`M${previousValue} L${x*xDistance + xDistance} ${yMid - (yMid / 10 * a)}`}></path>);
    }
    previousValue = `${x*xDistance + xDistance} ${yMid - (yMid / 10 * a)}`;
    return Path;
  });
  return (
    <div className="channel">
      <div className="channel-status">
        <div className="channel-status-wrapper">
          <p className="channel-number">CH 1</p>
        </div>
      </div>
      <div className="channel-amplitude">
        <div className="amplitude-min-max">
          <p className="amplitude-max">10 uV</p>
          <p className="amplitude-min">-10 uV</p>
        </div>
        <div className="graph-y-line">
          <svg xmlns="http://www.w3.org/2000/svg" className="y-line" viewBox="0 0 6 125">
            <g stroke="#CEDBFF" strokeWidth="2" fill="none">
              <path d="M6 0 L6 125"></path>
              <path d="M0 62.5 L6 62.5"></path>
            </g>
          </svg>
        </div>
        <div className="amplitude-graph">
          <svg xmlns="http://www.w3.org/2000/svg" className="amplitude-line" viewBox="0 0 100 125">
            <g stroke="#CEDBFF" strokeWidth="2" fill="none">
              {/* <path d="M0 62.5 L10 125"></path>
              <path d="M10 125 L20 1"></path>
              <path d="M20 1 L30 100"></path> */}
              { constructedGraph }
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Channel;
