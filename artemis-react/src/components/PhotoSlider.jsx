import { useState, useRef, useEffect } from 'react';

const PHOTOS = [
  { url: 'https://www.nasa.gov/wp-content/uploads/2026/04/art002e000192.jpg',                                                                       caption: 'ART002E000192' },
  { url: 'https://www.nasa.gov/wp-content/uploads/2026/04/art002e009057orig.jpg?resize=900,600',                                                    caption: 'ART002E009057' },
  { url: 'https://images-assets.nasa.gov/image/art002e009281/art002e009281~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint',                 caption: 'ART002E009281' },
  { url: 'https://www.nasa.gov/wp-content/uploads/2026/04/art002e009288orig.jpg?resize=2000,1333',                                                  caption: 'ART002E009288' },
  { url: 'https://images-assets.nasa.gov/image/art002e009287/art002e009287~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint',                 caption: 'ART002E009287' },
  { url: 'https://images-assets.nasa.gov/image/art002e009301/art002e009301~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint',                 caption: 'ART002E009301' },
  { url: 'https://images-assets.nasa.gov/image/art002e009298/art002e009298~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint',                 caption: 'ART002E009298' },
  { url: 'https://images-assets.nasa.gov/image/art002e009289/art002e009289~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint',                 caption: 'ART002E009289' },
  { url: 'https://images-assets.nasa.gov/image/art002e009302/art002e009302~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint',                 caption: 'ART002E009302' },
  { url: 'https://images-assets.nasa.gov/image/art002e009294/art002e009294~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint',                 caption: 'ART002E009294' },
  { url: 'https://images-assets.nasa.gov/image/art002e009299/art002e009299~large.jpg?w=900&h=600&fit=crop&crop=faces%2Cfocalpoint',                 caption: 'ART002E009299' },
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

function arrowBtn(side, onClick) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute', top: '50%', [side]: '6px',
        transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
        color: '#fff', width: '26px', height: '26px', borderRadius: '2px',
        cursor: 'pointer', fontSize: '20px', lineHeight: '1',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
      }}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  );
}

export default function PhotoSlider() {
  const [idx, setIdx] = useState(0);
  const touchX  = useRef(null);
  const timerRef = useRef(null);
  const photo    = PHOTOS[idx];

  const prev = () => setIdx(i => (i - 1 + PHOTOS.length) % PHOTOS.length);
  const next = () => setIdx(i => (i + 1) % PHOTOS.length);

  // Auto-advance every 5s; reset timer on manual nav
  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % PHOTOS.length), 5000);
  }

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, []);

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

  return (
    <div style={{ marginBottom: '10px' }}>
      <div className="panel-title" style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Onboard Imagery</span>
        <span style={{ fontSize: '8px', color: 'var(--text3)', fontWeight: 'normal', letterSpacing: '1px' }}>
          {idx + 1}&nbsp;/&nbsp;{PHOTOS.length}
        </span>
      </div>

      {/* Image area */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative', background: '#000',
          border: '1px solid var(--border2)', borderRadius: '4px', overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        <img
          key={photo.url}
          src={photo.url}
          alt={photo.caption}
          draggable={false}
          style={{ width: '100%', display: 'block', maxHeight: '175px', objectFit: 'cover', transition: 'opacity 0.4s', opacity: 1 }}
        />
        {arrowBtn('left', manualPrev)}
        {arrowBtn('right', manualNext)}

        {/* Caption bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '3px 8px',
          background: 'rgba(0,0,0,0.68)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '7px', color: 'var(--text3)', letterSpacing: '1px' }}>{photo.caption}</span>
          <span style={{ fontSize: '7px', color: 'var(--text3)', letterSpacing: '1px' }}>NASA / ARTEMIS II</span>
        </div>
      </div>

      {/* Dots + download row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          {PHOTOS.map((_, i) => (
            <button
              key={i}
              onClick={() => manualDot(i)}
              style={{
                width: '5px', height: '5px', borderRadius: '50%',
                border: 'none', padding: 0, cursor: 'pointer',
                background: i === idx ? 'var(--accent)' : 'var(--border2)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => downloadImage(photo.url, photo.caption)}
          style={{
            fontSize: '8px', color: 'var(--accent)',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '2px', padding: '2px 8px',
            cursor: 'pointer', letterSpacing: '1px',
            fontFamily: 'Courier New, monospace',
          }}
        >
          ↓ DOWNLOAD
        </button>
      </div>
    </div>
  );
}
