import React from 'react';

function Channel({ channelNumber, eegData}) {
  let constructedGraph = [];
  let xLineDistance = 10;
  let xTotalDistance = eegData.length * xLineDistance;
  let yMax = 125;
  let yMin = 0;
  let yMid = (yMax - yMin) / 2;
  let previousXY = `0 ${yMid}`;

  if (Array.isArray(eegData)) {
    for (let x = eegData.length - 1; x >= 0; x -= 1) {
      let Line = null;
      let d = eegData[x];
      let xPos = xTotalDistance - x*xLineDistance;
      let yPos = yMid - (yMid / 10 * d);
      let lineEnd = xPos - xLineDistance;
      Line = (<path d={`M${previousXY} L${lineEnd} ${yPos}`}></path>);
      previousXY = `${lineEnd} ${yPos}`;
      constructedGraph.push(Line);
    }
  }

  return (
    <div className="channel">
      <div className="channel-status">
        <div className="channel-status-wrapper">
          <p className="channel-number">CH {channelNumber}</p>
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
          <svg xmlns="http://www.w3.org/2000/svg" className="amplitude-line" viewBox={`0 0 ${xTotalDistance} 125`}>
            <g stroke="#CEDBFF" strokeWidth="1.5" fill="none">
              { constructedGraph }
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Channel;
