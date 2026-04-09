import { ring1, ring2, outbound, gap, moonLoop, returnPath, splash, MET_MAP } from '../data/trajectoryData.js';
import { LAUNCH_EPOCH_MS } from './index.js';
import cpPng from '../cp.png';

let _craftImg = null;
function getCraftImg() {
  if (!_craftImg) { _craftImg = new Image(); _craftImg.src = cpPng; }
  return _craftImg;
}

function easeIO(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

export function drawTrajectory(canvas, starsRef, camFrameRef, panRef) {
  if (!canvas || !canvas.parentElement) return;

  const wrap = canvas.parentElement;
  let W = wrap.offsetWidth || wrap.clientWidth;
  let H = wrap.offsetHeight || wrap.clientHeight;
  if (!W) W = window.innerWidth;
  if (!H) H = window.innerWidth < 768 ? 600 : 750;
  if (window.innerWidth >= 768) W = Math.min(W, window.innerWidth - 20);
  H = Math.max(H, 150);
  if (W <= 0 || H <= 0) return;

  // HiDPI / Retina fix — draw at physical pixels, scale context to logical coords
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#0b0d18';
  ctx.fillRect(0, 0, W, H);

  // Stars — drawn in screen space (no zoom transform)
  if (!starsRef.current) {
    starsRef.current = [];
    for (let i = 0; i < 200; i++) {
      starsRef.current.push({ x: Math.random(), y: Math.random(), r: Math.random() * 0.8 + 0.2, a: Math.random() * 0.45 + 0.08 });
    }
  }
  starsRef.current.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fill();
  });

  const scaleX = W / 1000, scaleY = H / 330;
  const sc = Math.min(scaleX, scaleY);
  const offX = (W - 1000 * sc) / 2;
  const offY = (H - 330 * sc) / 2;
  const sx = x => x * sc + offX;
  const sy = y => y * sc + offY;

  function drawSeg(pts, color, lw) {
    ctx.beginPath();
    ctx.moveTo(sx(pts[0][0]), sy(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i][0]), sy(pts[i][1]));
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  // Live craft position (computed before camera, needed for zoom target)
  const metH = (Date.now() - LAUNCH_EPOCH_MS) / 3600000;
  let animIdx = 0;
  if (metH >= 1.42) {
    for (const [ms, me, is, ie] of MET_MAP) {
      if (metH <= me) {
        const t = Math.max(0, Math.min(1, (metH - ms) / (me - ms)));
        animIdx = Math.round(is + t * (ie - is));
        break;
      }
      animIdx = 205;
    }
  }

  const allAnim = [...outbound, ...gap, ...moonLoop, ...returnPath, ...splash];
  const n_ob = outbound.length + gap.length;
  const n_ml = moonLoop.length;
  const n_rp = returnPath.length;

  const op = allAnim[Math.min(animIdx, allAnim.length - 1)];
  const ox = sx(op[0]), oy = sy(op[1]);

  // Camera zoom: mobile only — show full orbit first (~1.3s), then ease-zoom onto craft (~1.8s)
  const isMobile = window.innerWidth < 768;
  camFrameRef.current++;
  let zoom = 1, pivX = W / 2, pivY = H / 2;
  if (isMobile) {
    const CAM_DELAY   = 80;
    const CAM_ANIM    = 110;
    const TARGET_ZOOM = 2.4;
    const camAlpha    = camFrameRef.current <= CAM_DELAY
      ? 0
      : easeIO(Math.min(1, (camFrameRef.current - CAM_DELAY) / CAM_ANIM));
    zoom = 1 + camAlpha * (TARGET_ZOOM - 1);
    pivX = W / 2 + camAlpha * (ox - W / 2);
    pivY = H / 2 + camAlpha * (oy - H / 2);
  }

  // Apply zoom + pan transform — all trajectory content inside save/restore
  const panX = isMobile ? (panRef?.current?.x ?? 0) : 0;
  const panY = isMobile ? (panRef?.current?.y ?? 0) : 0;
  ctx.save();
  ctx.translate(panX, panY);      // pan (screen space, applied before zoom)
  ctx.translate(pivX, pivY);
  ctx.scale(zoom, zoom);
  ctx.translate(-pivX, -pivY);

  const LW_DIM = 1.5, LW_BRIGHT = 2;
  ctx.setLineDash([]);

  // Dim ghost paths
  drawSeg(ring1,      'rgba(0,212,255,0.18)', LW_DIM);
  drawSeg(ring2,      'rgba(0,255,180,0.18)', LW_DIM);
  drawSeg(outbound,   'rgba(34,197,94,0.20)', LW_DIM);
  drawSeg(gap,        'rgba(34,197,94,0.20)', LW_DIM);
  drawSeg(moonLoop,   'rgba(34,197,94,0.20)', LW_DIM);
  drawSeg(returnPath, 'rgba(6,182,212,0.20)', LW_DIM);
  drawSeg(splash,     'rgba(239,68,68,0.20)', LW_DIM);

  // Bright completed
  drawSeg(ring1, 'rgba(0,212,255,0.9)', LW_BRIGHT);
  drawSeg(ring2, 'rgba(0,255,180,0.9)', LW_BRIGHT);

  if (animIdx > 0) { const br = allAnim.slice(0, Math.min(animIdx, n_ob)); if (br.length > 1) drawSeg(br, 'rgba(34,197,94,0.9)', LW_BRIGHT); }
  if (animIdx > n_ob) { const br = allAnim.slice(n_ob, Math.min(animIdx, n_ob + n_ml)); if (br.length > 1) drawSeg(br, 'rgba(34,197,94,0.9)', LW_BRIGHT); }
  if (animIdx > n_ob + n_ml) { const br = allAnim.slice(n_ob + n_ml, Math.min(animIdx, n_ob + n_ml + n_rp)); if (br.length > 1) drawSeg(br, 'rgba(6,182,212,0.9)', LW_BRIGHT); }
  if (animIdx > n_ob + n_ml + n_rp) { const br = allAnim.slice(n_ob + n_ml + n_rp, animIdx); if (br.length > 1) drawSeg(br, 'rgba(239,68,68,0.9)', LW_BRIGHT); }

  // Earth
  const eX = sx(120), eY = sy(140), eR = 35 * sc;
  const eg = ctx.createRadialGradient(eX - eR * 0.2, eY - eR * 0.25, 0, eX, eY, eR);
  eg.addColorStop(0, '#60a5fa'); eg.addColorStop(0.6, '#2563eb'); eg.addColorStop(1, '#1e3a5f');
  ctx.fillStyle = eg; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(eX, eY, eR, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(150,180,220,0.6)';
  ctx.font = `${13.5 * sc}px Courier New`;
  ctx.textAlign = 'center';
  ctx.fillText('EARTH', eX, sy(195));

  // Moon
  const mX = sx(880), mY = sy(140), mR = 12 * sc;
  const mg = ctx.createRadialGradient(mX - mR * 0.2, mY - mR * 0.25, 0, mX, mY, mR);
  mg.addColorStop(0, '#d1d5db'); mg.addColorStop(0.6, '#9ca3af'); mg.addColorStop(1, '#6b7280');
  ctx.fillStyle = mg; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(mX, mY, mR, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(150,180,220,0.6)';
  ctx.font = `${13.5 * sc}px Courier New`;
  ctx.textAlign = 'center';
  ctx.fillText('MOON', mX, sy(164));

  // Waypoint dots
  function wdot(svgX, svgY, label, done) {
    const px = sx(svgX), py = sy(svgY), r = 3 * sc, fs = 10.5 * sc;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = done ? '#ffffff' : 'transparent';
    ctx.strokeStyle = done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
    ctx.font = `${fs}px Courier New`;
    ctx.fillStyle = done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'center';
    ctx.fillText(label, px, py - r - 3);
  }
  wdot(120,    90,    'Launch',         true);
  wdot(50.64,  91.79, 'TLI',            true);
  wdot(769.85, 119.60,'SOI Entry',      false);
  wdot(898.65,  99.05,'Close Approach', false);
  wdot(867.19, 183.14,'SOI Exit',       false);
  wdot(120.54, 140.25,'Splashdown',     false);

  // Orion craft — trail + dot + glow
  for (let i = 1; i <= 15; i++) {
    const ti = Math.max(0, animIdx - i);
    const tp = allAnim[ti];
    ctx.beginPath(); ctx.arc(sx(tp[0]), sy(tp[1]), 1.5 * sc, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,255,136,${(15 - i) / 15 * 0.47})`; ctx.fill();
  }
  const img = getCraftImg();
  const imgSize = 36 * sc;
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, ox - imgSize / 2, oy - imgSize / 2, imgSize, imgSize);
  } else {
    ctx.beginPath(); ctx.arc(ox, oy, 4 * sc, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88'; ctx.fill();
  }

  ctx.restore(); // end zoom transform

  // Corner labels — screen space, always readable regardless of zoom
  ctx.font = `${13.5 * sc}px Courier New`; ctx.fillStyle = 'rgba(55,85,115,0.80)';
  ctx.textAlign = 'left';  ctx.fillText('ORBIT MAP', offX + 4, offY + 12 * sc);
  ctx.textAlign = 'right'; ctx.fillText('FREE-RETURN TRAJECTORY', W - offX - 4, offY + 12 * sc);
}
