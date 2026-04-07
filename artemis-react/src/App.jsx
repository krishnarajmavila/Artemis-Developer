import { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import CenterPanel from './components/CenterPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import Footer from './components/Footer.jsx';
import InstallToast from './components/InstallToast.jsx';
import { milestonesData } from './data/milestones.js';
import { ganttActs, ganttAtt, ganttPhases } from './data/ganttData.js';
import { drawTrajectory } from './utils/drawTrajectory.js';
import { drawVelGraph } from './utils/drawGantt.js';
import {
  LAUNCH_EPOCH_MS, pad, formatMET, getRealMetSeconds,
  computeMilestones, computeNextBurn, computeNextEvent, getActiveItem,
  computePhase, computeFD, metToHours,
} from './utils/index.js';

const DSN_STATIONS = ['CAN/MAD', 'MAD/GOL', 'GOL/CAN'];

const INITIAL_SIM = {
  vel: 3319, earthDist: 124.1, moonDist: 118.7, alt: 120.1,
  pitch: -0.8, yaw: 152.5, roll: 0.0, uplink: 2.07, downlink: 8.42, gforce: 0.000,
};

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
    velDisplay: '3,319',
    alt: '120.1',
    earthDist: '124.1',
    moonDist: '118.7',
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
  };
}

export default function App() {
  const [disp, setDisp] = useState(buildInitialDisp);
  const [bmacVisible, setBmacVisible] = useState(true);

  const trajCanvasRef  = useRef(null);
  const velCanvasRef   = useRef(null);

  const simRef      = useRef({ ...INITIAL_SIM });
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
      const url = 'https://corsproxy.io/?' + encodeURIComponent(jplUrl);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const vec = parseHorizons(json.result || '');
      if (!vec) throw new Error('No data');

      const distKm  = Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
      const velKms  = Math.sqrt(vec.vx ** 2 + vec.vy ** 2 + vec.vz ** 2);
      const velMph  = velKms * 2236.94;
      const distKmi = (distKm * 0.621371 / 1000).toFixed(1);

      // Altitude above Earth's surface (subtract Earth radius 6,371 km)
      const altKm  = Math.max(0, distKm - 6371);
      const altKmi = (altKm * 0.621371 / 1000).toFixed(1);

      // Moon distance
      const moonLon = (218.316 + 13.176396 * (now - new Date('2000-01-01T12:00:00Z')) / 86400000) * Math.PI / 180;
      const mX = 384400 * Math.cos(moonLon), mY = 384400 * Math.sin(moonLon);
      const moonKmi = (Math.sqrt((vec.x - mX) ** 2 + (vec.y - mY) ** 2 + vec.z ** 2) * 0.621371 / 1000).toFixed(1);

      // Heading (yaw) from velocity vector projected into ecliptic plane
      const yawDeg = ((Math.atan2(vec.vy, vec.vx) * 180 / Math.PI) + 360) % 360;

      // Pitch: elevation angle of velocity vector above ecliptic plane
      const pitchDeg = Math.asin(Math.max(-1, Math.min(1, vec.vz / velKms))) * 180 / Math.PI;

      // Radial velocity (km/s), + = moving away from Earth
      const vRadial = (vec.x * vec.vx + vec.y * vec.vy + vec.z * vec.vz) / distKm;

      // Ecliptic longitude of craft (degrees)
      const eclLon = ((Math.atan2(vec.y, vec.x) * 180 / Math.PI) + 360) % 360;
      const eclLat = Math.asin(Math.max(-1, Math.min(1, vec.z / distKm))) * 180 / Math.PI;

      simRef.current.vel       = velMph;
      simRef.current.earthDist = parseFloat(distKmi);
      simRef.current.moonDist  = parseFloat(moonKmi);
      simRef.current.alt       = parseFloat(altKmi);

      setDisp(prev => ({
        ...prev,
        velDisplay: Math.round(velMph).toLocaleString(),
        earthDist:  distKmi,
        moonDist:   moonKmi,
        alt:        altKmi,
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

  // 1-second simulation tick
  const tick = useCallback(() => {
    tickRef.current++;
    const t = tickRef.current;
    const sim = simRef.current;
    const metSeconds = getRealMetSeconds();
    const metH = metSeconds / 3600;

    sim.vel        += (Math.random() - 0.502) * 2.5;
    sim.earthDist  += 0.003 + (Math.random() - 0.5) * 0.002;
    sim.moonDist   -= 0.003 + (Math.random() - 0.5) * 0.002;
    sim.alt        += (Math.random() - 0.5) * 0.01;
    sim.pitch      += (Math.random() - 0.5) * 0.05;
    sim.yaw        += (Math.random() - 0.5) * 0.08;
    sim.roll        = Math.sin(t / 200) * 1.5;
    sim.uplink      = 2.07 + (Math.random() - 0.5) * 0.15;
    sim.downlink    = 8.42 + (Math.random() - 0.5) * 0.3;
    sim.gforce      = Math.abs((Math.random() - 0.5) * 0.001);

    const sig = -147.3 + (Math.random() - 0.5) * 0.4;
    const lt  = (sim.earthDist * 1000 * 1.609 / 299792).toFixed(2);
    const saws = [11.2, 10.9, 11.1, 8.7].map(v => v + (Math.random() - 0.5) * 0.2);
    const total = saws.reduce((a, b) => a + b, 0);

    // DSN rotation
    dsnIdxRef.current = Math.floor(t / 15) % DSN_STATIONS.length;

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
      velDisplay: Math.round(sim.vel).toLocaleString(),
      alt: sim.alt.toFixed(1),
      earthDist: sim.earthDist.toFixed(1),
      moonDist: sim.moonDist.toFixed(1),
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
      dsnStation: DSN_STATIONS[dsnIdxRef.current],
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
    fetchHorizons();

    const simInterval = setInterval(tick, 1000);
    const horizonsInterval = setInterval(fetchHorizons, 60000);
    const dsnInterval = setInterval(() => {
      dsnIdxRef.current = (dsnIdxRef.current + 1) % DSN_STATIONS.length;
    }, 15000);

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
  }, [tick, fetchHorizons]);

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
        <div style={{ position:'fixed', bottom:'60px', right:'18px', zIndex:9999, display:'flex', alignItems:'center', gap:'6px' }}>
          <a
            href="/bmac.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Buy me a coffee"
            style={{
              display:'inline-flex', alignItems:'center', gap:'6px',
              background:'#FFDD00', color:'#000',
              fontWeight:'700', fontSize:'13px', letterSpacing:'0.2px',
              padding:'9px 16px', borderRadius:'24px',
              textDecoration:'none', fontFamily:"'Roboto',sans-serif",
              boxShadow:'0 4px 18px rgba(255,221,0,0.45), 0 2px 6px rgba(0,0,0,0.4)',
              border:'2px solid rgba(255,255,255,0.25)',
              whiteSpace:'nowrap',
              transition:'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(255,221,0,0.6), 0 2px 8px rgba(0,0,0,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 18px rgba(255,221,0,0.45), 0 2px 6px rgba(0,0,0,0.4)'; }}
          >
            ☕ Buy me a coffee
          </a>
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
    </div>
  );
}
