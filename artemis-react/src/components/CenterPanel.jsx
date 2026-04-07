import MissionTimeline from './MissionTimeline.jsx';

export default function CenterPanel({ disp, trajCanvasRef }) {
  return (
    <div className="mc-center">
      <div className="traj-panel">
        <div className="grid-coords">{disp.coords}</div>
        <div className="traj-canvas-wrap" style={{position:'relative'}}>
          <canvas id="trajCanvas" ref={trajCanvasRef}></canvas>
        </div>
        <div className="traj-info-bar" style={{display:'flex',borderTop:'1px solid var(--border)',flexShrink:0}}>
          <div className="traj-info-cell" style={{flex:'1',padding:'6px 10px',borderRight:'1px solid var(--border)'}}>
            <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px'}}>TRAJECTORY</div>
            <div style={{fontSize:'11px',color:'var(--accent)',fontWeight:'700',letterSpacing:'1px'}}>FREE-RETURN</div>
          </div>
          <div className="traj-info-cell" style={{flex:'1',padding:'6px 10px',borderRight:'1px solid var(--border)'}}>
            <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px'}}>CURRENT PHASE</div>
            <div style={{fontSize:'11px',color:'#fff',fontWeight:'700'}}>{disp.missionPhase}</div>
          </div>
          <div className="traj-info-cell" style={{flex:'1',padding:'6px 10px',borderRight:'1px solid var(--border)'}}>
            <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px'}}>FLIGHT DAY</div>
            <div style={{fontSize:'11px',color:'#fff',fontWeight:'700'}}>{disp.fdNum} / 10</div>
          </div>
          <div className="traj-info-cell" style={{flex:'1',padding:'6px 10px'}}>
            <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px'}}>NEXT BURN</div>
            <div style={{fontSize:'11px',color:'var(--warn)',fontWeight:'700'}}>{disp.nextBurn}</div>
          </div>
        </div>
      </div>

      <MissionTimeline />
    </div>
  );
}
