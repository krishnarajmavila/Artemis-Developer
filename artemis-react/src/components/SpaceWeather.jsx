import { useState, useEffect } from 'react';

// Kp thresholds
const KP_COLOR = v => v >= 7 ? '#ff2020' : v >= 5 ? '#ffaa00' : v >= 4 ? '#ffdd00' : v >= 2 ? '#00ff88' : '#00d4ff';
const KP_LABEL = v => v >= 7 ? 'SEVERE STORM' : v >= 6 ? 'STRONG STORM' : v >= 5 ? 'MODERATE STORM' : v >= 4 ? 'ACTIVE' : v >= 2 ? 'UNSETTLED' : 'QUIET';

// IMF Bz color — southward (negative) is geoeffective / more hazardous
const BZ_COLOR = bz => bz <= -10 ? '#ff2020' : bz <= -5 ? '#ffaa00' : bz <= 0 ? '#00d4ff' : '#00ff88';

const FETCH_INTERVAL = 5 * 60 * 1000;

// Kp bar: 0→9 with labeled breakpoints
const BAR_MARKS = [
  { pos: 0,        label: '0'     },
  { pos: 3 / 9,   label: 'Quiet' },
  { pos: 5 / 9,   label: 'Active'},
  { pos: 7 / 9,   label: 'Storm' },
  { pos: 1,        label: '9'    },
];

export default function SpaceWeather() {
  const [kp,      setKp]      = useState(null);
  const [kpHist,  setKpHist]  = useState([]);
  const [wind,    setWind]    = useState(null); // { speed, density }
  const [mag,     setMag]     = useState(null); // { bz, bt }
  const [updated, setUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    try {
      const [r1, r2, r3] = await Promise.allSettled([
        fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'),
        fetch('https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json'),
        fetch('https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json'),
      ]);

      // Kp index — returns array of objects: { time_tag, Kp, a_running, station_count }
      if (r1.status === 'fulfilled' && r1.value.ok) {
        const data = await r1.value.json();
        const parsed = data
          .map(r => parseFloat(r.Kp))
          .filter(v => !isNaN(v));
        const hist = parsed.slice(-24);
        setKpHist(hist);
        if (hist.length > 0) setKp(hist.at(-1));
      }

      // Solar wind plasma (speed + density)
      if (r2.status === 'fulfilled' && r2.value.ok) {
        const data = await r2.value.json();
        // Header is row[0]; columns: time_tag, density, speed, temperature
        const rows = data.slice(1).filter(r => r[1] != null && r[2] != null && r[1] !== '' && r[2] !== '');
        const lat  = rows.at(-1);
        if (lat) {
          const speed   = parseFloat(lat[2]);
          const density = parseFloat(lat[1]);
          if (!isNaN(speed) && !isNaN(density)) {
            setWind({ speed: Math.round(speed), density: density.toFixed(1) });
          }
        }
      }

      // IMF magnetic field (Bz + Bt)
      if (r3.status === 'fulfilled' && r3.value.ok) {
        const data = await r3.value.json();
        // columns: time_tag, bx_gsm, by_gsm, bz_gsm, lon_gsm, lat_gsm, bt
        const rows = data.slice(1).filter(r => r[3] != null && r[3] !== '' && r[6] != null);
        const lat  = rows.at(-1);
        if (lat) {
          const bz = parseFloat(lat[3]);
          const bt = parseFloat(lat[6]);
          if (!isNaN(bz) && !isNaN(bt)) {
            setMag({ bz: bz.toFixed(1), bt: bt.toFixed(1) });
          }
        }
      }

      setUpdated(new Date());
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, FETCH_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const kpColor = kp !== null ? KP_COLOR(kp) : '#00d4ff';
  const kpLabel = kp !== null ? KP_LABEL(kp) : '—';
  const kpPct   = kp !== null ? Math.min(100, (kp / 9) * 100) : 0;
  const bzColor = mag ? BZ_COLOR(parseFloat(mag.bz)) : '#00d4ff';

  return (
    <div style={{ marginBottom: '10px' }}>
      {/* ── Header ── */}
      <div className="panel-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span>Space Weather</span>
        <span style={{ fontSize:'8px', color:'var(--success)', letterSpacing:'1px' }}>
          ● NOAA SWPC
          {updated && <span style={{ color:'var(--text3)', marginLeft:'5px' }}>
            · {updated.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})}
          </span>}
        </span>
      </div>

      <div style={{
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:'4px', padding:'10px 12px', marginBottom:'8px',
      }}>
        {loading ? (
          <div style={{ fontSize:'9px', color:'var(--text3)', textAlign:'center', padding:'14px 0', letterSpacing:'1px' }}>
            CONNECTING TO SWPC...
          </div>
        ) : (
          <>
            {/* ── Kp row: label left, big number right ── */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
              <div>
                <div style={{ fontSize:'8px', color:'var(--text3)', letterSpacing:'1.5px', marginBottom:'4px' }}>KP INDEX</div>
                <div style={{ fontSize:'9px', fontWeight:'700', color: kpColor, letterSpacing:'1px' }}>{kpLabel}</div>
              </div>
              <div style={{
                fontSize:'32px', fontWeight:'700', color: kpColor,
                fontFamily:'Courier New,monospace', lineHeight:1,
                textShadow:`0 0 16px ${kpColor}99, 0 0 32px ${kpColor}44`,
              }}>
                {kp !== null ? kp.toFixed(1) : '—'}
              </div>
            </div>

            {/* ── Kp bar ── */}
            <div style={{ position:'relative', marginBottom:'14px' }}>
              {/* Track */}
              <div style={{ height:'6px', background:'var(--bg4)', borderRadius:'3px', overflow:'visible', position:'relative' }}>
                {/* Segment dividers */}
                {[3/9, 5/9, 7/9].map((pos, i) => (
                  <div key={i} style={{
                    position:'absolute', top:0, left:`${pos * 100}%`,
                    width:'1px', height:'100%', background:'rgba(255,255,255,0.12)', zIndex:2,
                  }} />
                ))}
                {/* Fill */}
                <div style={{
                  position:'absolute', top:0, left:0,
                  height:'100%', width:`${kpPct}%`,
                  background:`linear-gradient(90deg, #00d4ff 0%, #00ff88 30%, #ffdd00 55%, #ffaa00 70%, #ff2020 100%)`,
                  backgroundSize:'900px 100%',
                  backgroundPosition:`-${(1 - kpPct / 100) * 900 * 0.9}px 0`,
                  borderRadius:'3px',
                  boxShadow:`0 0 8px ${kpColor}88`,
                  transition:'width 1.2s ease',
                }} />
                {/* Dot at current value */}
                {kp !== null && (
                  <div style={{
                    position:'absolute', top:'50%', left:`${kpPct}%`,
                    transform:'translate(-50%, -50%)',
                    width:'10px', height:'10px', borderRadius:'50%',
                    background: kpColor, border:'2px solid var(--bg2)',
                    boxShadow:`0 0 8px ${kpColor}`,
                    zIndex:3, transition:'left 1.2s ease',
                  }} />
                )}
              </div>
              {/* Labels below bar */}
              <div style={{ position:'relative', height:'14px', marginTop:'3px' }}>
                {BAR_MARKS.map(({ pos, label }) => (
                  <span key={label} style={{
                    position:'absolute',
                    left:`${pos * 100}%`,
                    transform: pos === 0 ? 'none' : pos === 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                    fontSize:'8px', color:'var(--text3)', letterSpacing:'0.5px', whiteSpace:'nowrap',
                  }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Solar Wind row ── */}
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'7px 0', borderTop:'1px solid var(--border)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'14px', color:'var(--accent)', lineHeight:1 }}>↑</span>
                <div>
                  <div style={{ fontSize:'9px', color:'var(--text2)', fontWeight:'600', letterSpacing:'0.5px' }}>Solar Wind</div>
                  {wind?.density && (
                    <div style={{ fontSize:'8px', color:'var(--text3)', marginTop:'1px' }}>{wind.density} p/cm³</div>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:'3px' }}>
                {wind?.speed
                  ? <>
                      <span style={{ fontSize:'16px', fontWeight:'700', color:'#fff', fontFamily:'Courier New,monospace' }}>{wind.speed}</span>
                      <span style={{ fontSize:'9px', color:'var(--text3)' }}>km/s</span>
                    </>
                  : <span style={{ fontSize:'11px', color:'var(--text3)' }}>—</span>
                }
              </div>
            </div>

            {/* ── IMF Bz row ── */}
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'7px 0', borderTop:'1px solid var(--border)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'14px', color: mag ? bzColor : 'var(--accent)', lineHeight:1 }}>↕</span>
                <div>
                  <div style={{ fontSize:'9px', color:'var(--text2)', fontWeight:'600', letterSpacing:'0.5px' }}>IMF Bz</div>
                  {mag?.bt && (
                    <div style={{ fontSize:'8px', color:'var(--text3)', marginTop:'1px' }}>Bt: {mag.bt} nT</div>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:'3px' }}>
                {mag?.bz
                  ? <>
                      <span style={{ fontSize:'16px', fontWeight:'700', color: bzColor, fontFamily:'Courier New,monospace', textShadow:`0 0 8px ${bzColor}88` }}>
                        {mag.bz}
                      </span>
                      <span style={{ fontSize:'9px', color:'var(--text3)' }}>nT</span>
                    </>
                  : <span style={{ fontSize:'11px', color:'var(--text3)' }}>—</span>
                }
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
