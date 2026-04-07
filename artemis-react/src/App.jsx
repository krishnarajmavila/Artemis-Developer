import { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import CenterPanel from './components/CenterPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import Footer from './components/Footer.jsx';
import { milestonesData } from './data/milestones.js';
import { ganttActs, ganttAtt, ganttPhases } from './data/ganttData.js';
import { drawTrajectory } from './utils/drawTrajectory.js';
import { drawGantt, ganttScrollToNow, drawVelGraph } from './utils/drawGantt.js';
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

  const trajCanvasRef  = useRef(null);
  const velCanvasRef   = useRef(null);
  const ganttCanvasRef = useRef(null);
  const ganttWrapRef   = useRef(null);

  const simRef      = useRef({ ...INITIAL_SIM });
  const tickRef     = useRef(0);
  const velHistRef  = useRef([]);
  const starsRef    = useRef(null);
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
      const url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + new URLSearchParams({
        format: 'json', COMMAND: "'-1024'", OBJ_DATA: 'NO', MAKE_EPHEM: 'YES',
        EPHEM_TYPE: 'VECTORS', CENTER: "'500@399'",
        START_TIME: `'${toHorizonsTime(now)}'`, STOP_TIME: `'${toHorizonsTime(stop)}'`,
        STEP_SIZE: "'1m'", OUT_UNITS: 'KM-S', REF_PLANE: 'ECLIPTIC',
        REF_SYSTEM: 'J2000', VEC_TABLE: '3', VEC_CORR: 'NONE', CSV_FORMAT: 'YES',
      });
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const vec = parseHorizons(json.result || '');
      if (!vec) throw new Error('No data');

      const distKm = Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
      const velMph = Math.sqrt(vec.vx ** 2 + vec.vy ** 2 + vec.vz ** 2) * 2236.94;
      const distKmi = (distKm * 0.621371 / 1000).toFixed(1);
      const moonLon = (218.316 + 13.176396 * (now - new Date('2000-01-01T12:00:00Z')) / 86400000) * Math.PI / 180;
      const mX = 384400 * Math.cos(moonLon), mY = 384400 * Math.sin(moonLon);
      const moonKmi = (Math.sqrt((vec.x - mX) ** 2 + (vec.y - mY) ** 2 + vec.z ** 2) * 0.621371 / 1000).toFixed(1);

      simRef.current.vel = velMph;
      simRef.current.earthDist = parseFloat(distKmi);
      simRef.current.moonDist = parseFloat(moonKmi);
      simRef.current.alt = parseFloat(distKmi);

      setDisp(prev => ({
        ...prev,
        velDisplay: Math.round(velMph).toLocaleString(),
        earthDist: distKmi,
        moonDist: moonKmi,
        alt: distKmi,
        lightTime: (distKm / 299792.458).toFixed(2),
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
      gforce: sim.gforce,
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
      coords: `LAT ${lat}\u00b0 / LON ${lon}\u00b0`,
      milestones,
      crewAct: actItem ? actItem.l.toUpperCase() : '\u2014',
      attMode: attItem ? attItem.l.toUpperCase() : 'B-XSI',
      missionPhase: phaseItem ? phaseItem.l.toUpperCase() : 'TRANS-LUNAR',
    }));

    // Canvas draws
    drawVelGraph(velCanvasRef.current, velHistRef, sim.vel);
    drawGantt(ganttCanvasRef.current);
    if (window.innerWidth < 768) ganttScrollToNow(ganttWrapRef.current);
  }, []);

  useEffect(() => {
    // Initial draw
    tick();
    fetchHorizons();
    ganttScrollToNow(ganttWrapRef.current);

    const simInterval = setInterval(tick, 1000);
    const horizonsInterval = setInterval(fetchHorizons, 60000);
    const dsnInterval = setInterval(() => {
      dsnIdxRef.current = (dsnIdxRef.current + 1) % DSN_STATIONS.length;
    }, 15000);

    // Animation loop for trajectory canvas (60fps)
    let animId;
    function animLoop() {
      drawTrajectory(trajCanvasRef.current, starsRef);
      animId = requestAnimationFrame(animLoop);
    }
    animId = requestAnimationFrame(animLoop);

    const handleResize = () => drawTrajectory(trajCanvasRef.current, starsRef);
    window.addEventListener('resize', handleResize);

    // Scroll gantt to now after first render
    const scrollTimeout = setTimeout(() => ganttScrollToNow(ganttWrapRef.current), 100);

    return () => {
      clearInterval(simInterval);
      clearInterval(horizonsInterval);
      clearInterval(dsnInterval);
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(scrollTimeout);
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
          ganttCanvasRef={ganttCanvasRef}
          ganttWrapRef={ganttWrapRef}
        />
        <RightPanel disp={disp} />
      </div>
      <Footer disp={disp} />
    </div>
  );
}
