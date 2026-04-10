import { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import CenterPanel from './components/CenterPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import Footer from './components/Footer.jsx';
import InstallToast from './components/InstallToast.jsx';
import BmacModal from './components/BmacModal.jsx';
import { milestonesData } from './data/milestones.js';
import { ganttActs, ganttAtt, ganttPhases } from './data/ganttData.js';
import { drawTrajectory } from './utils/drawTrajectory.js';
import { drawVelGraph } from './utils/drawGantt.js';
import {
  LAUNCH_EPOCH_MS, pad, formatMET, getRealMetSeconds,
  computeMilestones, computeNextBurn, computeNextEvent, getActiveItem,
  computePhase, computeFD, metToHours,
} from './utils/index.js';

const DISH_META = {
  'DSS-14':'70m',  'DSS-24':'34m BWG','DSS-25':'34m BWG','DSS-26':'34m BWG',
  'DSS-34':'34m BWG','DSS-35':'34m BWG','DSS-36':'34m BWG','DSS-43':'34m HEF',
  'DSS-54':'34m BWG','DSS-55':'34m BWG','DSS-63':'34m BWG','DSS-65':'34m BWG',
};
const DISH_STATION = {
  'DSS-14':'GOLDSTONE','DSS-24':'GOLDSTONE','DSS-25':'GOLDSTONE','DSS-26':'GOLDSTONE',
  'DSS-34':'CANBERRA', 'DSS-35':'CANBERRA', 'DSS-36':'CANBERRA', 'DSS-43':'CANBERRA',
  'DSS-54':'MADRID',   'DSS-55':'MADRID',   'DSS-63':'MADRID',   'DSS-65':'MADRID',
};

// Position seeded to 0 — AROW fetch populates real values on load
const INITIAL_SIM = {
  vel: 0, earthDist: 0, moonDist: 0, alt: 0,
  pitch: -0.8, yaw: 152.5, roll: 0.0, uplink: 2.07, downlink: 8.42, gforce: 0.000,
};

// Always format miles with commas regardless of browser locale
function fmtMi(n) { return Math.round(n).toLocaleString('en-US'); }

function buildInitialDisp() {
  const metS = getRealMetSeconds();
  const metH = metS / 3600;
  const milestones = computeMilestones(metH, milestonesData);
  const nextEvent  = computeNextEvent(metH, milestones);
  const nextBurn   = computeNextBurn(metH, milestones);
  return {
    met: formatMET(metS),
    phase: computePhase(metH),
    fd: computeFD(metH),
    fdNum: String(Math.min(10, Math.max(1, Math.floor((metH + 7) / 24) + 1))),
    velDisplay: '—',
    alt: '—',
    earthDist: '—',
    moonDist: '—',
    pitch: -0.8,
    yaw: 152.5,
    roll: 0.0,
    uplink: 2.07,
    downlink: 8.42,
    gforce: 0.000,
    uplinkBarW: 72,
    downlinkBarW: 85,
    sigStrength: '-147.3',
    lightTime: '1.22',
    radVel: '—',
    sigBarW: 72,
    saws: [11.2, 10.9, 11.1, 8.7],
    totalPower: '41.9',
    dsnStation: 'CAN/MAD',
    nextBurn,
    nextEventLabel: nextEvent.label,
    nextEventTime: nextEvent.timeStr,
    utcClock: '',
    coords: 'LAT 0.0\u00b0 / LON 0.0\u00b0',
    liveStatus: 'Connecting to JPL Horizons...',
    milestones,
    crewAct: '\u2014',
    attMode: 'B-XSI',
    missionPhase: 'TRANS-LUNAR',
    dsnDishes: [],
    dsnLive: false,
  };
}

export default function App() {
  const [disp, setDisp] = useState(buildInitialDisp);
  const [bmacVisible, setBmacVisible] = useState(false);
  const [bmacOpen,    setBmacOpen]    = useState(false);
  useEffect(() => { const t = setTimeout(() => setBmacVisible(true), 6000); return () => clearTimeout(t); }, []);

  const trajCanvasRef  = useRef(null);
  const velCanvasRef   = useRef(null);

  const simRef      = useRef({ ...INITIAL_SIM });
  const arowReadyRef = useRef(false); // true after first successful AROW fetch
  const tickRef     = useRef(0);
  const velHistRef  = useRef([]);
  const starsRef    = useRef(null);
  const camFrameRef = useRef(0);
  const panRef      = useRef({ x: 0, y: 0 });
  const dragRef     = useRef({ active: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const dsnIdxRef   = useRef(0);

  // Fetch live telemetry from JPL Horizons
  const fetchHorizons = useCallback(async () => {
    function toHorizonsTime(d) { return d.toISOString().slice(0, 16).replace('T', ' '); }
    function parseHorizons(text) {
      const soe = text.indexOf('$$SOE'), eoe = text.indexOf('$$EOE');
      if (soe < 0 || eoe < 0) return null;
      const block = text.slice(soe + 5, eoe).trim();
      for (const line of block.split('\n')) {
        const p = line.split(',').map(s => s.trim());
        if (p.length >= 8 && !isNaN(parseFloat(p[2])))
          return { x: +p[2], y: +p[3], z: +p[4], vx: +p[5], vy: +p[6], vz: +p[7] };
      }
      const xm = block.match(/X\s*=\s*([-\d.E+]+)/i), ym = block.match(/Y\s*=\s*([-\d.E+]+)/i),
            zm = block.match(/Z\s*=\s*([-\d.E+]+)/i), vxm = block.match(/VX\s*=\s*([-\d.E+]+)/i),
            vym = block.match(/VY\s*=\s*([-\d.E+]+)/i), vzm = block.match(/VZ\s*=\s*([-\d.E+]+)/i);
      if (xm && ym && zm) return { x: +xm[1], y: +ym[1], z: +zm[1], vx: vxm ? +vxm[1] : 0, vy: vym ? +vym[1] : 0, vz: vzm ? +vzm[1] : 0 };
      return null;
    }
    try {
      const now = new Date(), stop = new Date(now.getTime() + 120000);
      const jplParams = new URLSearchParams({
        format: 'json', COMMAND: "'-1024'", OBJ_DATA: 'NO', MAKE_EPHEM: 'YES',
        EPHEM_TYPE: 'VECTORS', CENTER: "'500@399'",
        START_TIME: `'${toHorizonsTime(now)}'`, STOP_TIME: `'${toHorizonsTime(stop)}'`,
        STEP_SIZE: "'1m'", OUT_UNITS: 'KM-S', REF_PLANE: 'ECLIPTIC',
        REF_SYSTEM: 'J2000', VEC_TABLE: '3', VEC_CORR: 'NONE', CSV_FORMAT: 'YES',
      });
      const jplUrl = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + jplParams;
      const proxies = [
        'https://cors.eu.org/' + jplUrl,
        'https://corsproxy.io/?' + encodeURIComponent(jplUrl),
      ];
      let resp, lastErr;
      for (const url of proxies) {
        try { resp = await fetch(url); if (resp.ok) break; } catch(e) { lastErr = e; }
      }
      if (!resp || !resp.ok) throw new Error(lastErr?.message || 'All proxies failed');
      const json = await resp.json();
      const vec = parseHorizons(json.result || '');
      if (!vec) throw new Error('No data');

      const distKm  = Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
      const velKms  = Math.sqrt(vec.vx ** 2 + vec.vy ** 2 + vec.vz ** 2);
      const velMph  = velKms * 2236.94;
      const distMi = Math.round(distKm * 0.621371);

      // Altitude above Earth's surface (subtract Earth radius 6,371 km)
      const altKm = Math.max(0, distKm - 6371);
      const altMi = Math.round(altKm * 0.621371);

      // Moon distance
      const moonLon = (218.316 + 13.176396 * (now - new Date('2000-01-01T12:00:00Z')) / 86400000) * Math.PI / 180;
      const mX = 384400 * Math.cos(moonLon), mY = 384400 * Math.sin(moonLon);
      const moonMi = Math.round(Math.sqrt((vec.x - mX) ** 2 + (vec.y - mY) ** 2 + vec.z ** 2) * 0.621371);

      // Heading (yaw) from velocity vector projected into ecliptic plane
      const yawDeg = ((Math.atan2(vec.vy, vec.vx) * 180 / Math.PI) + 360) % 360;

      // Pitch: elevation angle of velocity vector above ecliptic plane
      const pitchDeg = Math.asin(Math.max(-1, Math.min(1, vec.vz / velKms))) * 180 / Math.PI;

      // Radial velocity (km/s), + = moving away from Earth
      const vRadial = (vec.x * vec.vx + vec.y * vec.vy + vec.z * vec.vz) / distKm;

      // Ecliptic longitude of craft (degrees)
      const eclLon = ((Math.atan2(vec.y, vec.x) * 180 / Math.PI) + 360) % 360;
      const eclLat = Math.asin(Math.max(-1, Math.min(1, vec.z / distKm))) * 180 / Math.PI;

      simRef.current.vel = velMph;

      // Use JPL position as fallback only when AROW hasn't loaded yet
      if (!arowReadyRef.current) {
        simRef.current.earthDist = distMi;
        simRef.current.moonDist  = moonMi;
        simRef.current.alt       = altMi;
        arowReadyRef.current     = true;
      }

      setDisp(prev => ({
        ...prev,
        velDisplay: Math.round(velMph).toLocaleString(),
        earthDist:  arowReadyRef.current ? fmtMi(simRef.current.earthDist) : '—',
        moonDist:   arowReadyRef.current ? fmtMi(simRef.current.moonDist)  : '—',
        alt:        arowReadyRef.current ? fmtMi(simRef.current.alt)        : '—',
        lightTime:  (distKm / 299792.458).toFixed(2),
        pitch:      parseFloat(pitchDeg.toFixed(1)),
        yaw:        parseFloat(yawDeg.toFixed(1)),
        coords:     `${eclLon.toFixed(2)}\u00b0 / ${eclLat.toFixed(2)}\u00b0`,
        radVel:     vRadial.toFixed(2),
        liveStatus: `LIVE · JPL Horizons · ${now.toUTCString().slice(17, 25)} UTC`,
      }));
    } catch (e) {
      setDisp(prev => ({
        ...prev,
        liveStatus: `EST · ${new Date().toUTCString().slice(17, 25)} UTC · ${e.message}`,
      }));
    }
  }, []);

  // Fetch live position from artemis.cdnspace.ca (AROW-based community API)
  const fetchAROW = useCallback(async () => {
    const AROW_URL = 'https://artemis.cdnspace.ca/api/all';
    const proxies  = [AROW_URL, `https://cors.eu.org/${AROW_URL}`];

    async function tryFetch(url) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000); // 6s per attempt
      try {
        const r = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!r.ok) throw new Error(r.status);
        return r.json();
      } finally { clearTimeout(timer); }
    }

    let data = null;
    for (const url of proxies) {
      try { data = await tryFetch(url); if (data) break; } catch (_) {}
    }
    try {
      if (!data) throw new Error('All sources failed');
      const tel  = data.telemetry;
      const arow = data.arow;
      if (!tel || typeof tel.earthDistKm !== 'number') throw new Error('No telemetry');

      const earthDistMi = Math.round(tel.earthDistKm  * 0.621371);
      const moonDistMi  = Math.round(tel.moonDistKm   * 0.621371);
      const altMi       = Math.round(tel.altitudeKm   * 0.621371);
      const velMph      = Math.round(tel.speedKmH     * 0.621371);

      simRef.current.earthDist = earthDistMi;
      simRef.current.moonDist  = moonDistMi;
      simRef.current.alt       = altMi;
      simRef.current.vel       = velMph;
      arowReadyRef.current     = true;
      if (typeof tel.gForce === 'number') simRef.current.gforce = tel.gForce;

      const ts = data.stateVector?.timestamp
        ? new Date(data.stateVector.timestamp).toUTCString().slice(17, 25)
        : new Date().toUTCString().slice(17, 25);

      const updates = {
        earthDist: fmtMi(earthDistMi),
        moonDist:  fmtMi(moonDistMi),
        alt:       fmtMi(altMi),
        velDisplay: velMph.toLocaleString('en-US'),
        lightTime:  (tel.earthDistKm / 299792.458).toFixed(2),
        gforce:    (tel.gForce ?? simRef.current.gforce).toFixed(4),
        liveStatus: `LIVE · AROW · ${ts} UTC`,
      };

      if (arow?.eulerDeg) {
        const { roll, pitch, yaw } = arow.eulerDeg;
        updates.pitch = parseFloat(pitch.toFixed(1));
        updates.yaw   = parseFloat(yaw.toFixed(1));
        updates.roll  = parseFloat(roll.toFixed(1));
        simRef.current.pitch = updates.pitch;
        simRef.current.yaw   = updates.yaw;
        simRef.current.roll  = updates.roll;
      }

      setDisp(prev => ({ ...prev, ...updates }));
    } catch (e) {
      setDisp(prev => ({ ...prev, liveStatus: `RECONNECTING · AROW · ${new Date().toUTCString().slice(17,25)} UTC` }));
    }
  }, []);

  // Fetch live DSN data for EM2 (Artemis II)
  const fetchDSN = useCallback(async () => {
    try {
      const resp = await fetch(`https://eyes.nasa.gov/dsn/data/dsn.xml?v=${Date.now()}`);
      if (!resp.ok) throw new Error(`DSN ${resp.status}`);
      const text = await resp.text();
      const dishes = [];
      const blocks = text.split('<dish ');
      for (const block of blocks.slice(1)) {
        if (!block.includes('spacecraft="EM2"')) continue;
        const name   = (block.match(/name="([^"]+)"/) || [])[1] || '';
        const upM    = block.match(/upSignal[^/]*/);
        const downM  = block.match(/downSignal[^/]*/);
        const tgtM   = block.match(/target[^/]*/);
        const upActive   = /active="true"/.test(upM?.[0] || '');
        const downActive = /active="true"/.test(downM?.[0] || '');
        const uplinkRate  = parseFloat((upM?.[0]  || '').match(/dataRate="([^"]+)"/)?.[1] || '0') / 1000;
        const downRate    = parseFloat((downM?.[0] || '').match(/dataRate="([^"]+)"/)?.[1] || '0') / 1000;
        const sigPower    = parseFloat((downM?.[0] || '').match(/power="([^"]+)"/)?.[1] || '0');
        const rtlt        = parseFloat((tgtM?.[0]  || '').match(/rtlt="([^"]+)"/)?.[1]  || '0');
        const upPower     = parseFloat((upM?.[0]   || '').match(/power="([^"]+)"/)?.[1] || '0');
        const dishName = name.replace('DSS', 'DSS-');
        dishes.push({
          name: dishName,
          station: DISH_STATION[dishName] || 'UNKNOWN',
          size: DISH_META[dishName] || '',
          upActive, downActive,
          uplinkRate, downRate, sigPower, rtlt, upPower,
        });
      }
      if (dishes.length > 0) {
        const primary = dishes.find(d => d.upActive || d.downActive) || dishes[0];

        // DSN rtlt is the most direct NASA measurement of Earth distance
        // one-way distance = rtlt/2 * speed of light
        const dsnUpdates = {
          dsnDishes: dishes,
          dsnLive: true,
          sigStrength: primary.sigPower.toFixed(1),
          lightTime:  (primary.rtlt / 2).toFixed(2),
          uplink:     primary.uplinkRate,
          downlink:   primary.downRate,
          dsnStation: primary.station,
        };
        if (primary.rtlt > 0) {
          const earthDistKm = (primary.rtlt / 2) * 299792.458;
          const earthDistMi = Math.round(earthDistKm * 0.621371);
          const altMi       = Math.round(Math.max(0, earthDistKm - 6371) * 0.621371);
          simRef.current.earthDist = earthDistMi;
          simRef.current.alt       = altMi;
          arowReadyRef.current     = true;
          dsnUpdates.earthDist = fmtMi(earthDistMi);
          dsnUpdates.alt       = fmtMi(altMi);
        }
        setDisp(prev => ({ ...prev, ...dsnUpdates }));
      }
    } catch(e) {
      // keep existing values on error
    }
  }, []);

  // 1-second simulation tick
  const tick = useCallback(() => {
    tickRef.current++;
    const t = tickRef.current;
    const sim = simRef.current;
    const metSeconds = getRealMetSeconds();
    const metH = metSeconds / 3600;

    // After lunar flyby (~130h MET) craft is returning: Earth dist decreases, Moon dist increases
    const returning = metH > 130;
    const drift = 1 + (Math.random() - 0.5) * 0.4; // ~1 mi/sec ≈ 3,600 mph cruise
    sim.vel        += (Math.random() - 0.502) * 2.5;
    sim.earthDist  += returning ? -drift : drift;
    sim.moonDist   += returning ? drift : -drift;
    sim.alt        += returning ? -drift : drift;
    sim.pitch      += (Math.random() - 0.5) * 0.05;
    sim.yaw        += (Math.random() - 0.5) * 0.08;
    sim.roll        = Math.sin(t / 200) * 1.5;
    sim.uplink      = 2.07 + (Math.random() - 0.5) * 0.15;
    sim.downlink    = 8.42 + (Math.random() - 0.5) * 0.3;
    sim.gforce      = Math.abs((Math.random() - 0.5) * 0.001);

    const sig = -147.3 + (Math.random() - 0.5) * 0.4;
    const lt  = (sim.earthDist * 1.60934 / 299792).toFixed(2);
    const saws = [11.2, 10.9, 11.1, 8.7].map(v => v + (Math.random() - 0.5) * 0.2);
    const total = saws.reduce((a, b) => a + b, 0);

    // Gantt chips
    const actItem   = getActiveItem(ganttActs,   metH);
    const attItem   = getActiveItem(ganttAtt,    metH);
    const phaseItem = getActiveItem(ganttPhases, metH);

    // Milestones
    const milestones = computeMilestones(metH, milestonesData);
    const nextBurn   = computeNextBurn(metH, milestones);
    const nextEvent  = computeNextEvent(metH, milestones);

    const now = new Date();
    const lat = (Math.sin(t / 800) * 15).toFixed(2);
    const lon = ((t * 0.5) % 360 - 180).toFixed(2);

    setDisp(prev => ({
      ...prev,
      met: formatMET(metSeconds),
      phase: computePhase(metH),
      fd: computeFD(metH),
      fdNum: String(Math.min(10, Math.max(1, Math.floor((metH + 7) / 24) + 1))),
      velDisplay: arowReadyRef.current ? Math.round(sim.vel).toLocaleString() : '—',
      alt:        arowReadyRef.current ? fmtMi(sim.alt)       : '—',
      earthDist:  arowReadyRef.current ? fmtMi(sim.earthDist) : '—',
      moonDist:   arowReadyRef.current ? fmtMi(sim.moonDist)  : '—',
      pitch: sim.pitch,
      yaw: sim.yaw,
      roll: sim.roll,
      gforce: sim.gforce.toFixed(4),
      uplink: sim.uplink,
      downlink: sim.downlink,
      uplinkBarW: Math.min(95, Math.max(40, sim.uplink / 3 * 100)),
      downlinkBarW: Math.min(98, Math.max(50, sim.downlink / 10 * 100)),
      sigStrength: sig.toFixed(1),
      lightTime: lt,
      sigBarW: 70 + Math.random() * 5,
      saws,
      totalPower: total.toFixed(1),
      nextBurn,
      nextEventLabel: nextEvent.label,
      nextEventTime: nextEvent.timeStr,
      utcClock: `UTC ${now.toISOString().replace('T', ' ').substring(0, 19)}`,
      // coords intentionally not overwritten here — set from live JPL data every 60s
      milestones,
      crewAct: actItem ? actItem.l.toUpperCase() : '\u2014',
      attMode: attItem ? attItem.l.toUpperCase() : 'B-XSI',
      missionPhase: phaseItem ? phaseItem.l.toUpperCase() : 'TRANS-LUNAR',
    }));

    // Canvas draws
    drawVelGraph(velCanvasRef.current, velHistRef, sim.vel);
  }, []);

  useEffect(() => {
    // Initial draw
    tick();
    fetchAROW();
    fetchHorizons();
    fetchDSN();

    const simInterval      = setInterval(tick,         1000);
    const arowInterval     = setInterval(fetchAROW,   30000);
    const horizonsInterval = setInterval(fetchHorizons, 60000);
    const dsnInterval      = setInterval(fetchDSN,    30000);

    // Animation loop for trajectory canvas (60fps)
    let animId;
    function animLoop() {
      drawTrajectory(trajCanvasRef.current, starsRef, camFrameRef, panRef);
      animId = requestAnimationFrame(animLoop);
    }
    animId = requestAnimationFrame(animLoop);

    const handleResize = () => {
      panRef.current = { x: 0, y: 0 }; // reset pan on resize so nothing goes off-screen
      drawTrajectory(trajCanvasRef.current, starsRef, camFrameRef, panRef);
    };
    window.addEventListener('resize', handleResize);

    // Mobile drag-to-pan touch handlers
    const canvas = trajCanvasRef.current;

    function onTouchStart(e) {
      if (window.innerWidth >= 768 || e.touches.length !== 1) return;
      const t = e.touches[0];
      dragRef.current = {
        active: true,
        startX: t.clientX, startY: t.clientY,
        startPanX: panRef.current.x, startPanY: panRef.current.y,
      };
    }

    function onTouchMove(e) {
      if (!dragRef.current.active || e.touches.length !== 1) return;
      e.preventDefault(); // prevent page scroll while panning canvas
      const t = e.touches[0];
      panRef.current = {
        x: dragRef.current.startPanX + (t.clientX - dragRef.current.startX),
        y: dragRef.current.startPanY + (t.clientY - dragRef.current.startY),
      };
    }

    function onTouchEnd() { dragRef.current.active = false; }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd);

    return () => {
      clearInterval(simInterval);
      clearInterval(horizonsInterval);
      clearInterval(dsnInterval);
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
};
  }, [tick, fetchAROW, fetchHorizons, fetchDSN]);

  return (
    <div className="mc-wrap">
      <Header disp={disp} />
      <div className="mc-main">
        <LeftPanel disp={disp} velCanvasRef={velCanvasRef} />
        <CenterPanel
          disp={disp}
          trajCanvasRef={trajCanvasRef}
        />
        <RightPanel disp={disp} />
      </div>
      <Footer disp={disp} />
      <InstallToast />
      {bmacVisible && (
        <div style={{ position:'fixed', bottom:'12px', right:'12px', zIndex:9999, display:'flex', alignItems:'center', gap:'6px' }}>
          <button
            onClick={() => setBmacOpen(true)}
            title="Buy me a coffee"
            style={{
              display:'inline-flex', alignItems:'center', gap:'6px',
              background:'#FFDD00', color:'#000',
              fontWeight:'700', fontSize:'13px', letterSpacing:'0.2px',
              padding:'7px 14px', borderRadius:'20px',
              fontFamily:"'Roboto',sans-serif",
              boxShadow:'0 4px 18px rgba(255,221,0,0.45), 0 2px 6px rgba(0,0,0,0.4)',
              border:'2px solid rgba(255,255,255,0.25)',
              whiteSpace:'nowrap', cursor:'pointer',
              transition:'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(255,221,0,0.6), 0 2px 8px rgba(0,0,0,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 18px rgba(255,221,0,0.45), 0 2px 6px rgba(0,0,0,0.4)'; }}
          >
            ☕ Buy me a coffee
          </button>
          <button
            onClick={() => setBmacVisible(false)}
            title="Hide"
            style={{
              width:'22px', height:'22px', borderRadius:'50%',
              background:'rgba(0,0,0,0.55)', border:'none',
              color:'rgba(255,255,255,0.7)', fontSize:'11px',
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              padding:'0', lineHeight:'1', flexShrink:0,
            }}
          >✕</button>
        </div>
      )}
      {bmacOpen && <BmacModal onClose={() => setBmacOpen(false)} />}
    </div>
  );
}
