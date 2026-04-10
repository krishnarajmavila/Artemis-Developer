import { useState, useEffect, useRef } from 'react';

const SPLASHDOWN_MS = new Date('2026-04-11T00:07:00Z').getTime();

const SHARE_TEXT = 'Real-time Artemis II Mission Control Dashboard — live trajectory, actual NASA data';

function ShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [open]);

  function shareWhatsApp() {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(SHARE_TEXT + '\n' + window.location.href)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    }).catch(() => {
      /* fallback for older browsers */
      const ta = document.createElement('textarea');
      ta.value = window.location.href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    });
  }

  return (
    <div className="share-wrap" ref={wrapRef}>
      <button className="share-btn" onClick={() => setOpen(o => !o)} aria-label="Share this page">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        <span className="share-btn-label">SHARE</span>
      </button>
      {open && (
        <div className="share-popover">
          <div className="share-pop-title">SHARE MISSION</div>
          <button className="share-option share-option-wa" onClick={shareWhatsApp}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
          <button className="share-option share-option-copy" onClick={copyLink}>
            {copied
              ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
              : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Link</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

function useSplashCountdown() {
  const [cd, setCd] = useState('');
  useEffect(() => {
    function calc() {
      const diff = SPLASHDOWN_MS - Date.now();
      if (diff <= 0) { setCd('SPLASHED'); return; }
      const d  = Math.floor(diff / 86400000);
      const h  = Math.floor((diff % 86400000) / 3600000);
      const m  = Math.floor((diff % 3600000)  / 60000);
      const s  = Math.floor((diff % 60000)    / 1000);
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const ss = String(s).padStart(2, '0');
      setCd(d > 0 ? `${d}/${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return cd;
}

export default function Header({ disp }) {
  const splashCd = useSplashCountdown();
  const splashed = splashCd === 'SPLASHED';
  return (
    <div className="mc-header">
      <div>
        <div className="mc-logo" style={{textShadow:'0 0 10px #00ffdccc, 0 0 20px #00ffdc66'}}>Artemis II &middot; Mission Control</div>
        <div style={{fontSize:'8px',color:'var(--text3)',letterSpacing:'1px',marginTop:'1px'}}>JOHNSON SPACE CENTER &middot; MCC-H</div>
      </div>
      <div className="met-block">
        {/* MET */}
        <div className="met-block-cell met-block-left">
          <div className="met-label">MISSION ELAPSED TIME</div>
          <div className="met-display">{disp.met}</div>
        </div>
        {/* Splashdown countdown */}
        <div className="met-block-cell">
          <div className="met-label" style={{color: splashed ? '#00ff88' : '#ff9f3a'}}>
            {splashed ? 'SPLASHDOWN' : 'T\u2212 SPLASHDOWN'}
          </div>
          <div className="met-display" style={{
            color: splashed ? '#00ff88' : '#ff9f3a',
            textShadow: splashed ? '0 0 8px #00ff8888' : '0 0 8px #ff9f3a88',
          }}>
            {splashCd}
          </div>
        </div>
      </div>
      <div className="phase-badge">{disp.phase}</div>
      <div className="fd-badge">{disp.fd}</div>
      <div className="hdr-spacer"></div>
      {/* <div className="hdr-stat">
        <div className="hdr-val">{disp.velDisplay}</div>
        <div className="hdr-lbl">VEL mph</div>
      </div> */}
      {/* <div className="hdr-sep" style={{width:'1px',height:'24px',background:'var(--border)'}}></div> */}
      <div className="hdr-stat">
        <div className="hdr-val">{disp.alt}</div>
        <div className="hdr-lbl">ALT mi</div>
      </div>
      <div className="hdr-sep" style={{width:'1px',height:'24px',background:'var(--border)'}}></div>
      <div className="hdr-stat">
        <div className="hdr-val">{disp.earthDist}</div>
        <div className="hdr-lbl">EARTH mi</div>
      </div>
      <div className="hdr-sep" style={{width:'1px',height:'24px',background:'var(--border)'}}></div>
      <div className="hdr-stat">
        <div className="hdr-val">{disp.moonDist}</div>
        <div className="hdr-lbl">MOON mi</div>
      </div>
      <div className="hdr-sep" style={{width:'1px',height:'24px',background:'var(--border)'}}></div>
      <div className="dsn-status">
        <div className="dsn-dot"></div>
        <div>DSN<br /><span style={{color:'var(--accent)',fontWeight:'700'}}>{disp.dsnStation}</span></div>
      </div>
      <ShareButton />
    </div>
  );
}
