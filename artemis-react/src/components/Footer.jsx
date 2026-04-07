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
        <span>Created by</span>
        <a href="https://www.linkedin.com/in/krishnaraj-m-e-97389a162" target="_blank" rel="noopener noreferrer">Krishnaraj M E</a>
      </div>
      <div style={{fontSize:'8px',color:'var(--text3)'}}>{disp.utcClock}</div>
      <div style={{fontSize:'8px',color:'var(--accent)',letterSpacing:'1px'}}>{disp.liveStatus}</div>
    </div>
  );
}
