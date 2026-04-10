import { useState, useEffect, useRef } from 'react';
import { ganttActs, ganttAtt, ganttPhases } from '../data/ganttData.js';
import { LAUNCH_EPOCH_MS } from '../utils/index.js';

// Data source: NASA Artemis II Flight Plan (official press kit documentation).
// No public real-time API exists for crew activity schedules.
// ganttData.js encodes the pre-planned crew timeline from NASA's published flight plan.

const REFRESH_MS  = 30 * 1000;
const PX_PER_SEC  = 42;

// Find the active item, preferring non-sleep / shortest (most specific) when overlapping
function findActive(arr, metH) {
  const active = arr.filter(i => i.h0 <= metH && i.h1 > metH);
  if (!active.length) {
    // Nothing current — return most recently passed item
    return [...arr].reverse().find(i => i.h1 <= metH) ?? null;
  }
  const nonSleep = active.filter(i => i.k !== 'sleep');
  const pool = nonSleep.length ? nonSleep : active;
  return pool.sort((a, b) => (a.h1 - a.h0) - (b.h1 - b.h0))[0];
}

function metHToStr(h) {
  if (h < 0) return '--/--:--';
  const fd = Math.floor(h / 24) + 1;
  const hh = Math.floor(h % 24);
  const mm = Math.floor((h % 1) * 60);
  return `${fd}/${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

function metHToUTC(h) {
  const d = new Date(LAUNCH_EPOCH_MS + h * 3600 * 1000);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDur(h) {
  const totalMin = Math.round(h * 60);
  const hr = Math.floor(totalMin / 60);
  const mn = totalMin % 60;
  if (hr === 0) return `${mn}m`;
  return mn ? `${hr}h ${mn}m` : `${hr}h`;
}

function calcPct(h0, h1, metH) {
  return Math.round(Math.min(100, Math.max(0, ((metH - h0) / (h1 - h0)) * 100)));
}

export default function ActivityTicker() {
  const [items,  setItems]  = useState([]);
  const [paused, setPaused] = useState(false);
  const trackRef            = useRef(null);

  function buildItems() {
    const metH  = (Date.now() - LAUNCH_EPOCH_MS) / 3_600_000;
    const crew  = findActive(ganttActs,   metH);
    const att   = findActive(ganttAtt,    metH);
    const phase = findActive(ganttPhases, metH);

    const built = [];

    const push = (cat, catColor, item) => {
      if (!item) return;
      built.push({
        cat, catColor,
        label:    item.l,
        progress: calcPct(item.h0, item.h1, metH),
        dur:      fmtDur(item.h1 - item.h0),
        metRange: `${metHToStr(item.h0)} → ${metHToStr(item.h1)}`,
        utcRange: `${metHToUTC(item.h0)} → ${metHToUTC(item.h1)}`,
      });
    };

    push('CREW',  '#00ff88', crew);
    push('ATT',   '#c8dcf0', att);
    push('PHASE', '#ffdd00', phase);

    setItems(built);
  }

  useEffect(() => {
    buildItems();
    const id = setInterval(buildItems, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!trackRef.current || !items.length) return;
    requestAnimationFrame(() => {
      if (!trackRef.current) return;
      const w   = trackRef.current.scrollWidth / 2;
      const dur = Math.max(20, Math.round(w / PX_PER_SEC));
      trackRef.current.style.animationDuration = `${dur}s`;
    });
  }, [items]);

  const doubled = [...items, ...items];

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0) }
          to   { transform: translateX(-50%) }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          white-space: nowrap;
          will-change: transform;
          animation: ticker-scroll 60s linear infinite;
        }
        .ticker-track.paused { animation-play-state: paused; }
        .act-item:hover .act-label { color: #00d4ff !important; }
      `}</style>

      <div
        className="news-ticker"
        style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--bg2)', borderTop: '1px solid var(--border)',
          overflow: 'hidden', position: 'relative',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Label */}
        <div style={{
          flexShrink: 0, padding: '0 12px',
          borderRight: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '6px',
          height: '100%', background: 'var(--bg3)', zIndex: 1,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4ff', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '1.5px', fontFamily: 'Courier New,monospace' }}>ACTIVITY</span>
        </div>

        {/* Scrolling track */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
          {!items.length ? (
            <span style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '1px', paddingLeft: '14px', fontFamily: 'Courier New,monospace' }}>
              LOADING CREW SCHEDULE...
            </span>
          ) : (
            <div ref={trackRef} className={`ticker-track${paused ? ' paused' : ''}`}>
              {doubled.map((item, i) => (
                <div
                  key={i}
                  className="act-item"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '12px',
                    padding: '0 26px',
                    borderRight: '1px solid var(--border)',
                    height: '38px', cursor: 'default',
                  }}
                >
                  {/* Category badge */}
                  <span style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                    color: '#000', background: item.catColor,
                    padding: '3px 7px', borderRadius: '3px',
                    fontFamily: 'Courier New,monospace', flexShrink: 0,
                  }}>
                    {item.cat}
                  </span>

                  {/* Activity name */}
                  <span className="act-label" style={{
                    fontSize: '13px', fontWeight: 700,
                    color: 'rgba(220,235,252,0.95)', letterSpacing: '0.5px',
                    fontFamily: 'Courier New,monospace', transition: 'color 0.15s',
                  }}>
                    {item.label}
                  </span>

                  {/* MET range */}
                  <span style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'Courier New,monospace' }}>
                    {item.metRange}
                  </span>

                  {/* Duration */}
                  <span style={{ fontSize: '10px', color: 'rgba(160,185,215,0.75)', fontFamily: 'Courier New,monospace' }}>
                    ({item.dur})
                  </span>

                  {/* Mini progress bar + % */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <div style={{ width: '52px', height: '4px', background: 'var(--bg4)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${item.progress}%`, height: '100%',
                        background: item.catColor, borderRadius: '2px',
                        boxShadow: `0 0 5px ${item.catColor}88`,
                        transition: 'width 1s',
                      }} />
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      color: item.catColor, fontFamily: 'Courier New,monospace',
                      minWidth: '32px',
                    }}>
                      {item.progress}%
                    </span>
                  </div>

                  {/* UTC range */}
                  <span style={{ fontSize: '10px', color: 'rgba(140,168,200,0.65)', fontFamily: 'Courier New,monospace' }}>
                    {item.utcRange}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right fade */}
        <div style={{
          position: 'absolute', right: 0, top: 0, width: '60px', height: '100%',
          background: 'linear-gradient(to right, transparent, var(--bg2))',
          pointerEvents: 'none', zIndex: 1,
        }} />
      </div>
    </>
  );
}
