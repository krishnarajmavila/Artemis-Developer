import { useState, useRef, useEffect } from 'react';

const PHOTOS = [
  { url: 'https://images-assets.nasa.gov/image/art002e009302/art002e009302~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint', caption: 'ART002E009302' },
  { url: 'https://images-assets.nasa.gov/image/art002e009301/art002e009301~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint', caption: 'ART002E009301' },
  { url: 'https://images-assets.nasa.gov/image/art002e009299/art002e009299~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint', caption: 'ART002E009299' },
  { url: 'https://images-assets.nasa.gov/image/art002e009298/art002e009298~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint', caption: 'ART002E009298' },
  { url: 'https://images-assets.nasa.gov/image/art002e009294/art002e009294~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint', caption: 'ART002E009294' },
  { url: 'https://images-assets.nasa.gov/image/art002e009289/art002e009289~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint', caption: 'ART002E009289' },
  { url: 'https://images-assets.nasa.gov/image/art002e009288/art002e009288~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint', caption: 'ART002E009288' },
  { url: 'https://images-assets.nasa.gov/image/art002e009287/art002e009287~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint', caption: 'ART002E009287' },
  { url: 'https://images-assets.nasa.gov/image/art002e009281/art002e009281~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint', caption: 'ART002E009281' },
  { url: 'https://www.nasa.gov/wp-content/uploads/2026/04/art002e009057orig.jpg?resize=900,600',                                    caption: 'ART002E009057' },
  { url: 'https://www.nasa.gov/wp-content/uploads/2026/04/art002e000192.jpg',                                                       caption: 'ART002E000192' },
];

async function downloadImage(url, caption) {
  try {
    const resp = await fetch(url, { mode: 'cors' });
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = `artemis2-${caption.toLowerCase()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objUrl);
  } catch {
    window.open(url, '_blank');
  }
}

function IconBtn({ onClick, title, children, style = {} }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
      color: '#fff', borderRadius: '2px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
      ...style,
    }}>{children}</button>
  );
}

export default function PhotoSlider() {
  const [idx, setIdx]         = useState(0);
  const [modal, setModal]     = useState(false);
  const touchX                = useRef(null);
  const timerRef              = useRef(null);
  const photo                 = PHOTOS[idx];

  const prev = () => setIdx(i => (i - 1 + PHOTOS.length) % PHOTOS.length);
  const next = () => setIdx(i => (i + 1) % PHOTOS.length);

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % PHOTOS.length), 5000);
  }

  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current); }, []);

  // Close modal on Escape
  useEffect(() => {
    if (!modal) return;
    const onKey = e => { if (e.key === 'Escape') setModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  function manualPrev() { prev(); resetTimer(); }
  function manualNext() { next(); resetTimer(); }
  function manualDot(i) { setIdx(i); resetTimer(); }

  function onTouchStart(e) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? manualNext() : manualPrev(); }
    touchX.current = null;
  }

  const arrowStyle = (side) => ({
    position: 'absolute', top: '50%', [side]: '8px',
    transform: 'translateY(-50%)',
    width: '32px', height: '32px', borderRadius: '3px', fontSize: '22px', lineHeight: '1',
  });

  return (
    <div style={{ marginBottom: '10px' }}>
      <div className="panel-title" style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Onboard Imagery</span>
        <span style={{ fontSize: '8px', color: 'var(--text3)', fontWeight: 'normal', letterSpacing: '1px' }}>
          {idx + 1}&nbsp;/&nbsp;{PHOTOS.length}
        </span>
      </div>

      {/* Thumbnail strip */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ position: 'relative', background: '#000', border: '1px solid var(--border2)', borderRadius: '4px', overflow: 'hidden', userSelect: 'none' }}>
        <img key={photo.url} src={photo.url} alt={photo.caption} draggable={false}
          style={{ width: '100%', display: 'block', maxHeight: '175px', objectFit: 'cover' }} />

        {/* Left / right arrows */}
        <IconBtn onClick={manualPrev} title="Previous" style={arrowStyle('left')}>‹</IconBtn>
        <IconBtn onClick={manualNext} title="Next"     style={arrowStyle('right')}>›</IconBtn>

        {/* Fullscreen button — top right */}
        <IconBtn onClick={() => setModal(true)} title="View fullscreen"
          style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '3px', fontSize: '13px' }}>
          ⛶
        </IconBtn>

        {/* Caption bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px 8px',
          background: 'rgba(0,0,0,0.68)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '7px', color: 'var(--text3)', letterSpacing: '1px' }}>{photo.caption}</span>
          <span style={{ fontSize: '7px', color: 'var(--text3)', letterSpacing: '1px' }}>NASA / ARTEMIS II</span>
        </div>
      </div>

      {/* Dots + download */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          {PHOTOS.map((_, i) => (
            <button key={i} onClick={() => manualDot(i)} style={{
              width: '5px', height: '5px', borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
              background: i === idx ? 'var(--accent)' : 'var(--border2)', transition: 'background 0.2s',
            }} />
          ))}
        </div>
        <button onClick={() => downloadImage(photo.url, photo.caption)} style={{
          fontSize: '8px', color: 'var(--accent)', background: 'var(--bg2)',
          border: '1px solid var(--border)', borderRadius: '2px', padding: '2px 8px',
          cursor: 'pointer', letterSpacing: '1px', fontFamily: 'Courier New, monospace',
        }}>↓ DOWNLOAD</button>
      </div>

      {/* Fullscreen modal */}
      {modal && (
        <div
          onClick={() => setModal(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={e => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) { dx < 0 ? manualNext() : manualPrev(); }
            else setModal(false);
            touchX.current = null;
          }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <img
            src={photo.url} alt={photo.caption} draggable={false}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 0 40px rgba(0,212,255,0.15)' }}
          />

          {/* Modal caption */}
          <div style={{ marginTop: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.55)', letterSpacing: '1px' }}>
            {photo.caption} &nbsp;·&nbsp; NASA / ARTEMIS II &nbsp;·&nbsp;
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>{idx + 1} / {PHOTOS.length}</span>
          </div>

          {/* Modal arrows */}
          <button onClick={e => { e.stopPropagation(); manualPrev(); }}
            style={{ position: 'fixed', left: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
              width: '44px', height: '44px', borderRadius: '4px', fontSize: '28px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <button onClick={e => { e.stopPropagation(); manualNext(); }}
            style={{ position: 'fixed', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
              width: '44px', height: '44px', borderRadius: '4px', fontSize: '28px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>

          {/* Close button */}
          <button onClick={() => setModal(false)}
            style={{ position: 'fixed', top: '14px', right: '14px',
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
              width: '36px', height: '36px', borderRadius: '4px', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

          {/* Dot strip */}
          <div style={{ position: 'fixed', bottom: '18px', display: 'flex', gap: '6px' }}>
            {PHOTOS.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); manualDot(i); }}
                style={{ width: '7px', height: '7px', borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
                  background: i === idx ? '#00d4ff' : 'rgba(255,255,255,0.25)', transition: 'background 0.2s' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
