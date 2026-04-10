import SpaceWeather from './SpaceWeather';

export default function LeftPanel({ disp, velCanvasRef }) {
  return (
    <div className="mc-panel">
      <div className="panel-title">Orbital Telemetry &middot; {disp.liveStatus && disp.liveStatus.startsWith('LIVE') ? <span style={{color:'var(--success)',fontSize:'10px'}}>LIVE</span> : 'estimated'}</div>

      <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px',marginBottom:'4px'}}>DYNAMICS</div>
      <div className="stat-row">
        <span className="stat-label">VELOCITY</span>
        <span><span className="stat-val accent">{disp.velDisplay}</span> <span className="stat-unit">mph</span></span>
      </div>
      <div className="stat-row">
        <span className="stat-label">G-FORCE</span>
        <span><span className="stat-val">{disp.gforce}</span> <span className="stat-unit">g</span></span>
      </div>
      <div className="stat-row">
        <span className="stat-label">RADIAL VEL</span>
        <span><span className="stat-val" style={{color: disp.radVel > 0 ? 'var(--warn)' : 'var(--accent)'}}>{disp.radVel ?? '—'}</span> <span className="stat-unit">km/s</span></span>
      </div>
      <div className="vel-graph"><canvas ref={velCanvasRef}></canvas></div>

      <SpaceWeather />

      <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px',margin:'8px 0 4px'}}>POSITION</div>
      <div className="stat-row">
        <span className="stat-label">ALTITUDE</span>
        <span><span className="stat-val">{disp.alt}</span> <span className="stat-unit">mi</span></span>
      </div>
      <div className="stat-row">
        <span className="stat-label">EARTH DIST</span>
        <span><span className="stat-val success">{disp.earthDist}</span> <span className="stat-unit">mi</span></span>
      </div>
      <div className="stat-row">
        <span className="stat-label">MOON DIST</span>
        <span><span className="stat-val">{disp.moonDist}</span> <span className="stat-unit">mi</span></span>
      </div>
      <div className="stat-row">
        <span className="stat-label">SIGNAL LAG</span>
        <span><span className="stat-val">{disp.lightTime}</span> <span className="stat-unit">s</span></span>
      </div>
      <div className="stat-row">
        <span className="stat-label">ECL COORDS</span>
        <span style={{fontSize:'11px',color:'var(--text2)',fontFamily:'Courier New,monospace'}}>{disp.coords}</span>
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

      <div className="panel-title" style={{marginTop:'10px'}}>
        Deep Space Network
        {disp.dsnLive && <span style={{marginLeft:'6px',fontSize:'8px',color:'var(--success)',letterSpacing:'1px'}}>● LIVE</span>}
      </div>
      <div className="dsn-panel">
        {disp.dsnDishes && disp.dsnDishes.length > 0 ? disp.dsnDishes.map((d, i) => (
          <div key={i}>
            <div className="dsn-ant">
              <div>
                <div className="dsn-ant-name">{d.name} {d.station}</div>
                <div style={{fontSize:'8px',color:'var(--text3)'}}>{d.size}</div>
              </div>
              <div className="dsn-ant-status">
                <div className={`dsn-ant-dot ${d.upActive || d.downActive ? 'dsn-active' : 'dsn-inactive'}`}></div>
                <span style={{color: d.upActive ? 'var(--warn)' : d.downActive ? 'var(--success)' : 'var(--text3)'}}>
                  {d.upActive ? 'UP+DOWN' : d.downActive ? 'DOWNLINK' : 'IDLE'}
                </span>
              </div>
            </div>
            {(d.upActive || d.downActive) && (
              <div style={{margin:'3px 0 4px'}}>
                <div className="link-indicator">
                  <span className="link-arrow">&uarr;</span>
                  <div className="dsn-bar"><div className="dsn-signal" style={{width: d.upActive ? '60%' : '0%'}}></div></div>
                  <span className="link-rate">{d.upActive ? `${d.upPower.toFixed(1)}kW` : '—'}</span>
                </div>
                <div className="link-indicator" style={{marginTop:'2px'}}>
                  <span className="link-arrow">&darr;</span>
                  <div className="dsn-bar"><div className="dsn-signal" style={{width: d.downActive ? '90%' : '0%'}}></div></div>
                  <span className="link-rate">{d.downActive ? (d.downRate >= 1000 ? `${(d.downRate/1000).toFixed(1)}Mbps` : `${d.downRate.toFixed(0)}kbps`) : '—'}</span>
                </div>
                <div style={{fontSize:'8px',color:'var(--text3)',marginTop:'2px'}}>
                  SIG {d.sigPower} dBm &nbsp;·&nbsp; RTLT {d.rtlt.toFixed(2)}s
                </div>
              </div>
            )}
          </div>
        )) : (
          <div style={{fontSize:'9px',color:'var(--text3)',padding:'6px 0'}}>Connecting to DSN feed...</div>
        )}
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
