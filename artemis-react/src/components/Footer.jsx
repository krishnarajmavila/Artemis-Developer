export default function Footer({ disp }) {
  return (
    <div className="mc-footer">
      <div className="footer-item"><div className="footer-dot"></div> MCC-H NOMINAL</div>
      <div className="footer-item"><div className="footer-dot"></div> ECLSS NOMINAL</div>
      <div className="footer-item"><div className="footer-dot"></div> GNC NOMINAL</div>
      <div className="footer-item"><div className="footer-dot" style={{background:'var(--warn)'}}></div> OMS-E STANDBY</div>
      <div className="footer-item"><div className="footer-dot"></div> THERMAL NOMINAL</div>
      <div style={{flex:'1'}}></div>
      <div className="next-event-box">
        <div>
          <div className="ne-label">NEXT MILESTONE</div>
          <div className="ne-val">{disp.nextEventLabel}</div>
        </div>
        <div className="ne-time">{disp.nextEventTime}</div>
      </div>
      <div className="footer-credits">
        <span style={{color:'var(--text3)'}}>·</span>
        <span>Built by</span>
        <a href="/bmac.html" target="_blank" rel="noopener noreferrer"
           style={{
             background:'linear-gradient(90deg,#0d2137,#0a3a52)',
             color:'#00d4ff',
             fontWeight:'700',
             fontSize:'10px',
             letterSpacing:'1.5px',
             padding:'3px 10px',
             borderRadius:'4px',
             border:'1px solid rgba(0,212,255,0.45)',
             boxShadow:'0 0 8px rgba(0,212,255,0.25)',
             textDecoration:'none',
             fontFamily:'Courier New,monospace',
             whiteSpace:'nowrap',
           }}>✦ KRISHNARAJ M E</a>
      </div>
      <div style={{fontSize:'8px',color:'var(--text3)'}}>{disp.utcClock}</div>
      <div style={{fontSize:'8px',color:'var(--accent)',letterSpacing:'1px'}}>{disp.liveStatus}</div>
    </div>
  );
}
