export default function LeftPanel({ disp, velCanvasRef }) {
  return (
    <div className="mc-panel">
      <div className="panel-title">Orbital Telemetry &middot; estimated</div>

      <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px',marginBottom:'4px'}}>DYNAMICS</div>
      <div className="stat-row">
        <span className="stat-label">VELOCITY</span>
        <span><span className="stat-val accent">{disp.velDisplay}</span> <span className="stat-unit">mph</span></span>
      </div>
      <div className="stat-row">
        <span className="stat-label">G-FORCE</span>
        <span><span className="stat-val">{disp.gforce}</span> <span className="stat-unit">g</span></span>
      </div>
      <div className="vel-graph"><canvas ref={velCanvasRef}></canvas></div>

      <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px',margin:'8px 0 4px'}}>POSITION</div>
      <div className="stat-row">
        <span className="stat-label">ALTITUDE</span>
        <span><span className="stat-val">{disp.alt}</span> <span className="stat-unit">kmi</span></span>
      </div>
      <div className="stat-row">
        <span className="stat-label">EARTH DIST</span>
        <span><span className="stat-val success">{disp.earthDist}</span> <span className="stat-unit">kmi</span></span>
      </div>
      <div className="stat-row">
        <span className="stat-label">MOON DIST</span>
        <span><span className="stat-val">{disp.moonDist}</span> <span className="stat-unit">kmi</span></span>
      </div>

      <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px',margin:'8px 0 4px'}}>ORBIT</div>
      <div className="stat-row">
        <span className="stat-label">PERIAPSIS</span>
        <span><span className="stat-val">115</span> <span className="stat-unit">mi</span></span>
      </div>
      <div className="stat-row">
        <span className="stat-label">APOAPSIS</span>
        <span><span className="stat-val">{disp.alt}</span> <span className="stat-unit">kmi</span></span>
      </div>

      <div className="attitude-box">
        <div className="attitude-title">ATTITUDE &middot; B-XSI MODE</div>
        <div className="gauge-row">
          <span className="gauge-label">PITCH</span>
          <div className="gauge-track"><div className="gauge-fill pitch" style={{width:`${50 + disp.pitch / 2}%`}}></div></div>
          <span className="gauge-val">{disp.pitch.toFixed(1)}&deg;</span>
        </div>
        <div className="gauge-row">
          <span className="gauge-label">YAW</span>
          <div className="gauge-track"><div className="gauge-fill yaw" style={{width:`${(disp.yaw / 360 * 100).toFixed(1)}%`}}></div></div>
          <span className="gauge-val">{disp.yaw.toFixed(1)}&deg;</span>
        </div>
        <div className="gauge-row">
          <span className="gauge-label">ROLL</span>
          <div className="gauge-track"><div className="gauge-fill roll" style={{width:`${50 + disp.roll / 4}%`}}></div></div>
          <span className="gauge-val">{disp.roll.toFixed(1)}&deg;</span>
        </div>
      </div>

      <div className="panel-title" style={{marginTop:'10px'}}>Deep Space Network</div>
      <div className="dsn-panel">
        <div className="dsn-ant">
          <div>
            <div className="dsn-ant-name">DSS-63 MADRID</div>
            <div style={{fontSize:'8px',color:'var(--text3)'}}>34m BWG</div>
          </div>
          <div className="dsn-ant-status">
            <div className="dsn-ant-dot dsn-active"></div>
            <span style={{color:'var(--success)'}}>UPLINK</span>
          </div>
        </div>
        <div style={{margin:'3px 0'}}>
          <div className="link-indicator">
            <span className="link-arrow">&uarr;</span>
            <div className="dsn-bar"><div className="dsn-signal" style={{width:`${disp.uplinkBarW}%`}}></div></div>
            <span className="link-rate">{disp.uplink.toFixed(2)}</span>
            <span style={{fontSize:'7px',color:'var(--text3)'}}>kbps</span>
          </div>
          <div className="link-indicator" style={{marginTop:'2px'}}>
            <span className="link-arrow">&darr;</span>
            <div className="dsn-bar"><div className="dsn-signal" style={{width:`${disp.downlinkBarW}%`}}></div></div>
            <span className="link-rate">{disp.downlink.toFixed(2)}</span>
            <span style={{fontSize:'7px',color:'var(--text3)'}}>kbps</span>
          </div>
        </div>
        <div className="dsn-ant" style={{marginTop:'4px'}}>
          <div>
            <div className="dsn-ant-name">DSS-23 CANBERRA</div>
            <div style={{fontSize:'8px',color:'var(--text3)'}}>34m BWG</div>
          </div>
          <div className="dsn-ant-status">
            <div className="dsn-ant-dot dsn-inactive"></div>
            <span style={{color:'var(--text3)'}}>STANDBY</span>
          </div>
        </div>
        <div className="dsn-ant">
          <div>
            <div className="dsn-ant-name">DSS-14 GOLDSTONE</div>
            <div style={{fontSize:'8px',color:'var(--text3)'}}>70m</div>
          </div>
          <div className="dsn-ant-status">
            <div className="dsn-ant-dot dsn-inactive"></div>
            <span style={{color:'var(--text3)'}}>IDLE</span>
          </div>
        </div>
      </div>

      <div className="panel-title" style={{marginTop:'4px'}}>Crew Status</div>
      <div className="crew-panel">
        <div className="crew-member">
          <div className="crew-avatar">RW</div>
          <div><div className="crew-name">Reid Wiseman</div><div className="crew-role">Commander</div></div>
          <div style={{marginLeft:'auto',fontSize:'8px',color:'var(--success)'}}>&#9679; ACTIVE</div>
        </div>
        <div className="crew-member">
          <div className="crew-avatar">VG</div>
          <div><div className="crew-name">Victor Glover</div><div className="crew-role">Pilot</div></div>
          <div style={{marginLeft:'auto',fontSize:'8px',color:'var(--success)'}}>&#9679; ACTIVE</div>
        </div>
        <div className="crew-member">
          <div className="crew-avatar">CH</div>
          <div><div className="crew-name">Christina Koch</div><div className="crew-role">MS1</div></div>
          <div style={{marginLeft:'auto',fontSize:'8px',color:'var(--success)'}}>&#9679; ACTIVE</div>
        </div>
        <div className="crew-member" style={{marginBottom:'0'}}>
          <div className="crew-avatar" style={{color:'#cc8'}}>JH</div>
          <div><div className="crew-name">Jeremy Hansen</div><div className="crew-role">MS2 &middot; CSA</div></div>
          <div style={{marginLeft:'auto',fontSize:'8px',color:'var(--success)'}}>&#9679; ACTIVE</div>
        </div>
      </div>
    </div>
  );
}
