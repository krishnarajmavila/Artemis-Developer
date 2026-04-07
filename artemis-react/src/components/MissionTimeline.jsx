import { useRef, useEffect } from 'react';
import { flightDays, milestonesData } from '../data/milestones.js';
import { LAUNCH_EPOCH_MS } from '../utils/index.js';

function metToHours(met) {
  const [d, hm] = met.split('/');
  const [h, m]  = hm.split(':');
  return parseInt(d) * 24 + parseInt(h) + parseInt(m) / 60;
}

function formatCountdown(hrs) {
  if (hrs <= 0) return 'NOW';
  const d = Math.floor(hrs / 24);
  const h = Math.floor(hrs % 24);
  const m = Math.floor((hrs * 60) % 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const TYPE_COLOR = { burn:'#ff7c3a', key:'#00d4ff', record:'#ffd700', obs:'#00ff88', splash:'#00cfff' };
const TYPE_BG    = { burn:'rgba(255,124,58,0.15)', key:'rgba(0,212,255,0.12)', record:'rgba(255,215,0,0.12)', obs:'rgba(0,255,136,0.12)', splash:'rgba(0,207,255,0.12)' };
const TYPE_ICON  = { burn:'🔥', key:'◆', record:'★', obs:'◉', splash:'🌊' };

export default function MissionTimeline() {
  const scrollRef = useRef(null);
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0 });

  const metH       = (Date.now() - LAUNCH_EPOCH_MS) / 3600000;
  const currentFD  = Math.min(10, Math.max(1, Math.floor(metH / 24) + 1));
  const missionPct = Math.min(100, Math.max(0, (metH / (9 * 24 + 1.77)) * 100));
  const nextMs     = milestonesData.find(m => metToHours(m.met) > metH);

  // Auto-scroll current FD into view on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const col = el.querySelector(`[data-fd="${currentFD}"]`);
    if (col) setTimeout(() => col.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 200);
  }, [currentFD]);

  // Touch drag-to-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onStart = e => {
      dragState.current = { active: true, startX: e.touches[0].clientX, scrollLeft: el.scrollLeft };
    };
    const onMove = e => {
      if (!dragState.current.active) return;
      const dx = dragState.current.startX - e.touches[0].clientX;
      el.scrollLeft = dragState.current.scrollLeft + dx;
    };
    const onEnd = () => { dragState.current.active = false; };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: true });
    el.addEventListener('touchend',   onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, []);

  return (
    <div className="mission-timeline-wrap" style={{ background:'#0c1220', borderTop:'2px solid #1e3a5f', display:'flex', flexDirection:'column', flexShrink:0, height:'260px', overflow:'hidden', boxSizing:'border-box' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 12px 5px', borderBottom:'1px solid #1e3a5f', flexShrink:0, background:'#0f1929' }}>
        <div style={{ fontSize:'10px', letterSpacing:'3px', color:'#6b8cae', fontFamily:'Courier New,monospace', whiteSpace:'nowrap', fontWeight:'700' }}>
          MISSION TIMELINE
          <span style={{ marginLeft:'8px', color:'#00d4ff', fontSize:'10px' }}>FD{currentFD}/10</span>
        </div>
        {nextMs && (
          <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'10px', fontFamily:'Courier New,monospace', minWidth:0, overflow:'hidden' }}>
            <span style={{ color:'#6b8cae', flexShrink:0 }}>NEXT:</span>
            <span style={{ color:TYPE_COLOR[nextMs.type]||'#00d4ff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:'600' }}>
              {TYPE_ICON[nextMs.type]} {nextMs.label}
            </span>
            <span style={{ color:'#ff9500', background:'rgba(255,149,0,0.15)', border:'1px solid rgba(255,149,0,0.5)', borderRadius:'3px', padding:'2px 7px', flexShrink:0, fontWeight:'700', fontSize:'10px' }}>
              {formatCountdown(metToHours(nextMs.met) - metH)}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height:'4px', background:'#1a2340', position:'relative', flexShrink:0 }}>
        <div style={{ height:'100%', width:`${missionPct}%`, background:'linear-gradient(90deg,#7722cc,#00d4ff)', transition:'width 1s linear' }} />
        <div style={{ position:'absolute', top:'-3px', left:`${missionPct}%`, transform:'translateX(-50%)', width:'10px', height:'10px', borderRadius:'50%', background:'#00d4ff', boxShadow:'0 0 8px #00d4ff, 0 0 16px rgba(0,212,255,0.4)' }} />
      </div>

      {/* Scrollable card row */}
      <div
        ref={scrollRef}
        className="mission-timeline-scroll"
        style={{ display:'flex', overflowX:'auto', overflowY:'hidden', flex:'1 1 0', width:'100%', minWidth:'100%', padding:'6px 8px', gap:'6px', scrollbarWidth:'thin', cursor:'grab', userSelect:'none', WebkitOverflowScrolling:'touch' }}
      >
        {flightDays.map(({ fd, phase, color, events }) => {
          const isCurrent = fd === currentFD;
          const isDone    = fd < currentFD;
          const fdStart   = (fd - 1) * 24;
          const fdMs      = milestonesData.filter(m => metToHours(m.met) >= fdStart && metToHours(m.met) < fdStart + 26);

          return (
            <div key={fd} data-fd={fd} style={{
              flexShrink:0, width:'125px', height:'100%',
              background: isCurrent ? 'rgba(0,212,255,0.07)' : '#0d1526',
              border: isCurrent ? '1px solid rgba(0,212,255,0.55)' : '1px solid #1e2d4a',
              borderRadius:'6px', overflow:'hidden', display:'flex', flexDirection:'column',
              opacity: isDone ? 0.55 : 1,
              boxShadow: isCurrent ? '0 0 14px rgba(0,212,255,0.2), inset 0 0 20px rgba(0,212,255,0.03)' : 'none',
            }}>
              {/* Day header */}
              <div style={{ background: isCurrent ? `${color}44` : `${color}22`, borderBottom:`2px solid ${color}`, padding:'5px 7px', flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'11px', fontWeight:'700', color: isCurrent ? '#ffffff' : '#c1d0e4', fontFamily:'Courier New,monospace', letterSpacing:'1px' }}>
                    FD{String(fd).padStart(2,'0')}
                    {isDone    && <span style={{ fontSize:'9px', marginLeft:'4px', color:'#00e676' }}>✓</span>}
                    {isCurrent && <span style={{ fontSize:'8px', marginLeft:'4px', color:'#00d4ff', letterSpacing:'1px' }}>▶ NOW</span>}
                  </span>
                </div>
                <div style={{ fontSize:'8px', color, letterSpacing:'0.8px', marginTop:'2px', lineHeight:'1.2', fontWeight:'600', textTransform:'uppercase' }}>{phase}</div>
              </div>

              {/* Content — scrollable vertically within card */}
              <div style={{ flex:1, overflowY:'auto', padding:'5px 6px', scrollbarWidth:'none', fontFamily: isCurrent ? '"Inter","Segoe UI",system-ui,sans-serif' : 'inherit' }}>
                {/* Milestones */}
                {fdMs.map((m, i) => {
                  const isPast = metToHours(m.met) < metH;
                  // Current card: brighter palette. Other cards: keep muted.
                  const mColor = isCurrent
                    ? (isPast ? '#5c7a96' : TYPE_COLOR[m.type] || '#00d4ff')
                    : (isPast ? '#4a5e78' : TYPE_COLOR[m.type] || '#00d4ff');
                  const metColor = isCurrent
                    ? (isPast ? '#3d5570' : '#7aaac8')
                    : (isPast ? '#364a5e' : '#5a7896');
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'4px', marginBottom:'4px', background: (!isPast && isCurrent) ? TYPE_BG[m.type] : 'transparent', borderRadius:'3px', padding: (!isPast && isCurrent) ? '2px 3px' : '0' }}>
                      <span style={{ fontSize:'9px', flexShrink:0, marginTop:'1px', opacity: isPast ? (isCurrent ? 0.45 : 0.4) : 1 }}>{TYPE_ICON[m.type]}</span>
                      <div>
                        <div style={{ fontSize:'9px', color: mColor, lineHeight:'1.35', textDecoration: isPast ? 'line-through' : 'none', fontWeight: isCurrent && !isPast ? '700' : '400', letterSpacing: isCurrent ? '0.1px' : '0' }}>{m.label}</div>
                        <div style={{ fontSize:'8px', color: metColor, letterSpacing:'0.5px', fontFamily:'Courier New,monospace' }}>{m.met}</div>
                      </div>
                    </div>
                  );
                })}
                {/* Divider */}
                {fdMs.length > 0 && events.length > 0 && (
                  <div style={{ borderTop:'1px solid #1e2d4a', margin:'4px 0' }} />
                )}
                {/* Activities */}
                {events.map((e, i) => (
                  <div key={i} style={{ fontSize:'8px', color: isDone ? '#4a7a5a' : (isCurrent ? '#7a9db8' : '#5a7896'), lineHeight:'1.65', display:'flex', alignItems:'center', gap:'4px', fontWeight: isCurrent ? '500' : '400' }}>
                    <span style={{ color: isDone ? '#00e676' : (isCurrent ? '#3a6a9a' : '#2a4a6e'), fontSize: isCurrent ? '5px' : '6px', flexShrink:0 }}>{isCurrent ? '●' : '■'}</span>{e}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
