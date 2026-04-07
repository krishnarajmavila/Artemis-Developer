export default function Header({ disp }) {
  return (
    <div className="mc-header">
      <div>
        <div className="mc-logo">Artemis II &middot; Mission Control</div>
        <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px',marginTop:'1px'}}>JOHNSON SPACE CENTER &middot; MCC-H</div>
      </div>
      <div className="live-badge">&#9679; LIVE</div>
      <div style={{marginLeft:'8px'}}>
        <div className="met-label">MISSION ELAPSED TIME</div>
        <div className="met-display">{disp.met}</div>
      </div>
      <div className="phase-badge">{disp.phase}</div>
      <div className="fd-badge">{disp.fd}</div>
      <div className="hdr-spacer"></div>
      <div className="hdr-stat">
        <div className="hdr-val">{disp.velDisplay}</div>
        <div className="hdr-lbl">VEL mph</div>
      </div>
      <div className="hdr-sep" style={{width:'1px',height:'24px',background:'var(--border)'}}></div>
      <div className="hdr-stat">
        <div className="hdr-val">{disp.alt}</div>
        <div className="hdr-lbl">ALT kmi</div>
      </div>
      <div className="hdr-sep" style={{width:'1px',height:'24px',background:'var(--border)'}}></div>
      <div className="hdr-stat">
        <div className="hdr-val">{disp.earthDist}</div>
        <div className="hdr-lbl">EARTH kmi</div>
      </div>
      <div className="hdr-sep" style={{width:'1px',height:'24px',background:'var(--border)'}}></div>
      <div className="hdr-stat">
        <div className="hdr-val">{disp.moonDist}</div>
        <div className="hdr-lbl">MOON kmi</div>
      </div>
      <div className="hdr-sep" style={{width:'1px',height:'24px',background:'var(--border)'}}></div>
      <div className="dsn-status">
        <div className="dsn-dot"></div>
        <div>DSN<br /><span style={{color:'var(--accent)',fontWeight:'700'}}>{disp.dsnStation}</span></div>
      </div>
    </div>
  );
}
