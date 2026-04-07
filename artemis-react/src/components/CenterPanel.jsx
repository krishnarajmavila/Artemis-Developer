export default function CenterPanel({ disp, trajCanvasRef, ganttCanvasRef, ganttWrapRef }) {
  return (
    <div className="mc-center">
      <div className="traj-panel">
        <div className="grid-coords">{disp.coords}</div>
        <div className="traj-canvas-wrap" style={{position:'relative'}}>
          <canvas id="trajCanvas" ref={trajCanvasRef}></canvas>
        </div>
        <div style={{display:'flex',gap:'0',borderTop:'1px solid var(--border)',flexShrink:'0'}}>
          <div style={{flex:'1',padding:'6px 10px',borderRight:'1px solid var(--border)'}}>
            <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px'}}>TRAJECTORY TYPE</div>
            <div style={{fontSize:'11px',color:'var(--accent)',fontWeight:'700',letterSpacing:'1px'}}>FREE-RETURN</div>
          </div>
          <div style={{flex:'1',padding:'6px 10px',borderRight:'1px solid var(--border)'}}>
            <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px'}}>CURRENT PHASE</div>
            <div style={{fontSize:'11px',color:'#fff',fontWeight:'700'}}>{disp.missionPhase} COAST</div>
          </div>
          <div style={{flex:'1',padding:'6px 10px',borderRight:'1px solid var(--border)'}}>
            <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px'}}>FLIGHT DAY</div>
            <div style={{fontSize:'11px',color:'#fff',fontWeight:'700'}}>
              {disp.fdNum} / 10
            </div>
          </div>
          <div style={{flex:'1',padding:'6px 10px'}}>
            <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px'}}>NEXT BURN</div>
            <div style={{fontSize:'11px',color:'var(--warn)',fontWeight:'700'}}>{disp.nextBurn}</div>
          </div>
        </div>
      </div>

      <div className="timeline-panel">
        <div className="timeline-title">
          MISSION OVERVIEW &middot; CREW FLIGHT PLAN &nbsp;
          <span style={{color:'var(--text3)',fontWeight:'normal'}}>&#9632; SLEEP &nbsp;&#9632; EXERCISE &nbsp;&#9632; PAO &nbsp;&#9632; SCIENCE &nbsp;&#9632; MEAL &nbsp;&#9632; OFF DUTY &nbsp;&#9632; BURN</span>
        </div>
        <div className="gantt-wrap" ref={ganttWrapRef}>
          <canvas id="ganttCanvas" ref={ganttCanvasRef}></canvas>
        </div>
      </div>

      <div style={{background:'var(--bg2)',borderTop:'1px solid var(--border)',padding:'8px',display:'flex',gap:'1px',flexShrink:'0'}}>
        <div style={{flex:'1',borderRight:'1px solid var(--border)',paddingRight:'8px'}}>
          <div className="panel-title" style={{marginBottom:'4px'}}>Current Activities</div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <div style={{background:'var(--bg4)',borderLeft:'2px solid var(--accent)',padding:'3px 6px',fontSize:'9px',color:'var(--accent)'}}>CREW: {disp.crewAct}</div>
            <div style={{background:'var(--bg4)',borderLeft:'2px solid var(--accent3)',padding:'3px 6px',fontSize:'9px',color:'var(--accent3)'}}>ATT: {disp.attMode}</div>
            <div style={{background:'var(--bg4)',borderLeft:'2px solid var(--warn)',padding:'3px 6px',fontSize:'9px',color:'var(--warn)'}}>PHASE: {disp.missionPhase}</div>
          </div>
        </div>
        <div style={{flex:'1',paddingLeft:'8px'}}>
          <div className="panel-title" style={{marginBottom:'4px'}}>Upcoming (next 8h)</div>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
            <div style={{fontSize:'9px',color:'var(--text2)'}}>Doc Cam <span style={{color:'var(--warn)'}}>54m</span></div>
            <div style={{fontSize:'9px',color:'var(--text2)'}}>CVP <span style={{color:'var(--warn)'}}>1h 54m</span></div>
            <div style={{fontSize:'9px',color:'var(--text2)'}}>FTO <span style={{color:'var(--warn)'}}>4h 54m</span></div>
            <div style={{fontSize:'9px',color:'var(--text2)'}}>Crew Sleep <span style={{color:'var(--amber)'}}>8h 24m</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
