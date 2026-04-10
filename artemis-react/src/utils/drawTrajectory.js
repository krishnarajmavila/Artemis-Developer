import { ring1, ring2, outbound, gap, moonLoop, returnPath, splash, MET_MAP } from '../data/trajectoryData.js';
import { LAUNCH_EPOCH_MS } from './index.js';
import cpPng from '../cp.png';
import cPng  from '../c.png';

// CM/SM Separation at MET 9d 01h 13m
const CM_SEP_MS = (9 * 24 * 60 + 1 * 60 + 13) * 60 * 1000;

let _craftImg = null, _cmImg = null;
function getCraftImg() {
  if (!_craftImg) { _craftImg = new Image(); _craftImg.src = cpPng; }
  return _craftImg;
}
function getCmImg() {
  if (!_cmImg) { _cmImg = new Image(); _cmImg.src = cPng; }
  return _cmImg;
}

function easeIO(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

function rRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

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

  // Stars
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
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(sx(pts[0][0]), sy(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i][0]), sy(pts[i][1]));
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  // Live craft position
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
  const n_ob = outbound.length + gap.length; // 83
  const n_ml = moonLoop.length;              // 40
  const n_rp = returnPath.length;            // 60

  // ── Mathematically correct Entry Interface (EI) position ──
  // EI is defined at 400,000 ft = 121.92 km altitude above Earth's surface.
  // Earth visual radius in SVG coords = 35 units (represents 6,371 km).
  // EI SVG radius = 35 × (6371 + 121.92) / 6371 = 35.670 SVG units from Earth center.
  // Direction: unit vector from Earth center toward the end of returnPath (approach vector).
  const EARTH_C  = [120, 140]; // Earth center, SVG coords
  const EI_R_SVG = 35 * (6371 + 121.92) / 6371; // ≈ 35.670 SVG units
  const _eiAppr  = [returnPath[returnPath.length - 1][0] - EARTH_C[0],
                    returnPath[returnPath.length - 1][1] - EARTH_C[1]];
  const _eiMag   = Math.sqrt(_eiAppr[0] ** 2 + _eiAppr[1] ** 2);
  const EI_SVG_PT = [
    EARTH_C[0] + (_eiAppr[0] / _eiMag) * EI_R_SVG,
    EARTH_C[1] + (_eiAppr[1] / _eiMag) * EI_R_SVG,
  ]; // ≈ [152.5, 154.8]

  const op = allAnim[Math.min(animIdx, allAnim.length - 1)];
  const ox = sx(op[0]), oy = sy(op[1]);

  // Phase detection
  const inOutbound  = animIdx < n_ob;
  const inMoonLoop  = animIdx >= n_ob && animIdx < n_ob + n_ml;
  const inReturn    = animIdx >= n_ob + n_ml && animIdx < n_ob + n_ml + n_rp;
  const inSplash    = animIdx >= n_ob + n_ml + n_rp;
  const isHomeBound = inReturn || inSplash;

  // Craft trail & glow color by phase
  const craftColor  = inSplash ? '#ff7722' : isHomeBound ? '#00d4ff' : '#00ff88';
  const trailColor  = inSplash ? 'rgba(255,120,0,' : isHomeBound ? 'rgba(0,212,255,' : 'rgba(0,255,136,';

  // Camera zoom (mobile)
  const isMobile = window.innerWidth < 768;
  camFrameRef.current++;
  let zoom = 1, pivX = W / 2, pivY = H / 2;
  if (isMobile) {
    const CAM_DELAY = 80, CAM_ANIM = 110, TARGET_ZOOM = 2.2;
    const camAlpha = camFrameRef.current <= CAM_DELAY
      ? 0
      : easeIO(Math.min(1, (camFrameRef.current - CAM_DELAY) / CAM_ANIM));
    zoom = 1 + camAlpha * (TARGET_ZOOM - 1);
    pivX = W / 2 + camAlpha * (ox - W / 2) - camAlpha * 140;
    pivY = H / 2 + camAlpha * (oy - H / 2) - camAlpha * 40;
  }

  const panX = isMobile ? (panRef?.current?.x ?? 0) : 0;
  const panY = isMobile ? (panRef?.current?.y ?? 0) : 0;

  ctx.save();
  ctx.translate(panX, panY);
  ctx.translate(pivX, pivY);
  ctx.scale(zoom, zoom);
  ctx.translate(-pivX, -pivY);

  const LW_DIM = 1.5, LW_BRIGHT = 2;
  ctx.setLineDash([]);

  // ── Dim ghost paths ──
  drawSeg(ring1,      'rgba(0,212,255,0.18)', LW_DIM);
  drawSeg(ring2,      'rgba(0,255,180,0.18)', LW_DIM);
  drawSeg(outbound,   'rgba(34,197,94,0.20)', LW_DIM);
  drawSeg(gap,        'rgba(34,197,94,0.20)', LW_DIM);
  drawSeg(moonLoop,   'rgba(34,197,94,0.20)', LW_DIM);
  drawSeg(returnPath, 'rgba(6,182,212,0.20)', LW_DIM);
  drawSeg(splash,     'rgba(239,68,68,0.20)', LW_DIM);

  // ── Bright completed path ──
  drawSeg(ring1, 'rgba(0,212,255,0.9)', LW_BRIGHT);
  drawSeg(ring2, 'rgba(0,255,180,0.9)', LW_BRIGHT);
  if (animIdx > 0) { const br = allAnim.slice(0, Math.min(animIdx, n_ob)); if (br.length > 1) drawSeg(br, 'rgba(34,197,94,0.9)', LW_BRIGHT); }
  if (animIdx > n_ob) { const br = allAnim.slice(n_ob, Math.min(animIdx, n_ob + n_ml)); if (br.length > 1) drawSeg(br, 'rgba(34,197,94,0.9)', LW_BRIGHT); }
  if (animIdx > n_ob + n_ml) { const br = allAnim.slice(n_ob + n_ml, Math.min(animIdx, n_ob + n_ml + n_rp)); if (br.length > 1) drawSeg(br, 'rgba(6,182,212,0.9)', LW_BRIGHT); }
  if (animIdx > n_ob + n_ml + n_rp) { const br = allAnim.slice(n_ob + n_ml + n_rp, animIdx); if (br.length > 1) drawSeg(br, 'rgba(239,68,68,0.9)', LW_BRIGHT); }

  // ── NEW: Dashed remaining path to splashdown ──
  if (isHomeBound && animIdx < allAnim.length - 1) {
    const remaining = allAnim.slice(animIdx);
    ctx.setLineDash([4 * sc, 3 * sc]);
    drawSeg(remaining, inSplash ? 'rgba(255,119,34,0.7)' : 'rgba(0,212,255,0.6)', 1.5);
    ctx.setLineDash([]);
  }

  // ── NEW: Entry corridor (when homeward bound) ──
  if (isHomeBound) {
    const eiX = sx(EI_SVG_PT[0]), eiY = sy(EI_SVG_PT[1]); // EI at 121.92 km altitude
    const eaX = sx(EARTH_C[0]),   eaY = sy(EARTH_C[1]);   // Earth center
    const dx = eaX - eiX, dy = eaY - eiY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len, py = dx / len; // perpendicular
    const hw = 7 * sc;

    ctx.setLineDash([2 * sc, 3 * sc]);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgba(255,200,80,0.4)';
    ctx.beginPath(); ctx.moveTo(eiX + px * hw, eiY + py * hw); ctx.lineTo(eaX + px * 1.5 * sc, eaY + py * 1.5 * sc); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eiX - px * hw, eiY - py * hw); ctx.lineTo(eaX - px * 1.5 * sc, eaY - py * 1.5 * sc); ctx.stroke();
    ctx.setLineDash([]);

    // EI dot
    ctx.beginPath(); ctx.arc(eiX, eiY, 3 * sc, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,200,80,0.85)'; ctx.fill();

    // EI label with altitude annotation
    ctx.font = `bold ${9 * sc}px Courier New`;
    ctx.fillStyle = 'rgba(255,200,80,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText('EI · 400,000 ft', eiX + 5 * sc, eiY - 5 * sc);
    ctx.font = `${7.5 * sc}px Courier New`;
    ctx.fillStyle = 'rgba(255,200,80,0.55)';
    ctx.fillText('121.9 km', eiX + 5 * sc, eiY + 5 * sc);
  }

  // ── Earth ──
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

  // ── Moon ──
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

  // ── NEW: Splashdown target — pulsing rings + crosshair ──
  const splashX = sx(120.54), splashY = sy(140.25);
  const time = camFrameRef.current / 60;
  // Rings kept smaller so they don't overlay the label area
  const rings = [
    { phase: 0,   baseR: 38, maxAdd: 5, maxAlpha: 0.55 },
    { phase: 1.2, baseR: 46, maxAdd: 7, maxAlpha: 0.35 },
    { phase: 2.4, baseR: 54, maxAdd: 9, maxAlpha: 0.20 },
  ];
  rings.forEach(({ phase, baseR, maxAdd, maxAlpha }) => {
    const p = (Math.sin(time * 2.0 + phase) + 1) / 2;
    const r = (baseR + p * maxAdd) * sc;
    const alpha = maxAlpha * (1 - p * 0.6);
    ctx.beginPath(); ctx.arc(splashX, splashY, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239,68,68,${alpha})`;
    ctx.lineWidth = 1.2 * sc;
    ctx.stroke();
  });

  // Crosshair
  const ch = 5 * sc;
  ctx.strokeStyle = 'rgba(239,68,68,0.75)';
  ctx.lineWidth = 1 * sc;
  ctx.beginPath();
  ctx.moveTo(splashX - ch, splashY); ctx.lineTo(splashX + ch, splashY);
  ctx.moveTo(splashX, splashY - ch); ctx.lineTo(splashX, splashY + ch);
  ctx.stroke();

  // "RECOVERY ZONE · PACIFIC" — anchored to the LEFT of Earth with a leader line
  // so it never overlaps the ring/arc area
  const rzLabelX = sx(42), rzLabelY = sy(230);
  ctx.strokeStyle = 'rgba(239,68,68,0.30)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([2 * sc, 2 * sc]);
  ctx.beginPath(); ctx.moveTo(rzLabelX + 60 * sc, rzLabelY - 4 * sc); ctx.lineTo(splashX - 38 * sc, splashY + 10 * sc); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `bold ${8.5 * sc}px Courier New`;
  ctx.fillStyle = 'rgba(239,68,68,0.70)';
  ctx.textAlign = 'left';
  ctx.fillText('RECOVERY ZONE', rzLabelX, rzLabelY);
  ctx.font = `${7.5 * sc}px Courier New`;
  ctx.fillStyle = 'rgba(239,68,68,0.40)';
  ctx.fillText('PACIFIC OCEAN', rzLabelX, rzLabelY + 10 * sc);

  // ── Waypoint dots ──
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
  wdot(769.85, 119.60,'SOI Entry',      animIdx >= n_ob);
  wdot(898.65,  99.05,'Close Approach', animIdx >= n_ob + n_ml / 2);
  wdot(867.19, 183.14,'SOI Exit',       animIdx >= n_ob + n_ml);

  // ── Orion craft — trail + image ──
  for (let i = 1; i <= 15; i++) {
    const ti = Math.max(0, animIdx - i);
    const tp = allAnim[ti];
    ctx.beginPath(); ctx.arc(sx(tp[0]), sy(tp[1]), 1.5 * sc, 0, Math.PI * 2);
    ctx.fillStyle = `${trailColor}${(15 - i) / 15 * 0.47})`; ctx.fill();
  }
  // Glow behind craft
  const glowGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, 12 * sc);
  glowGrad.addColorStop(0, craftColor + '44');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.beginPath(); ctx.arc(ox, oy, 12 * sc, 0, Math.PI * 2); ctx.fill();

  // ── NEW: Parachutes — deployed during splash/entry phase ──
  if (inSplash) {
    const splashProg = (animIdx - (n_ob + n_ml + n_rp)) / Math.max(1, splash.length - 1); // 0→1
    // Three Orion main chutes in a cluster, triangular arrangement
    const chuteR    = (4 + splashProg * 9) * sc;   // grows as craft descends
    const lineLen   = (10 + splashProg * 12) * sc;  // suspension line length
    const craftTop  = oy - 14 * sc;
    const offsets   = [[-chuteR * 1.1, -lineLen], [0, -lineLen * 1.15], [chuteR * 1.1, -lineLen]];

    offsets.forEach(([dx, dy]) => {
      const cx = ox + dx, cy = craftTop + dy;

      // Suspension lines first (drawn under canopy)
      ctx.strokeStyle = 'rgba(255,200,120,0.55)';
      ctx.lineWidth = 0.6 * sc;
      ctx.beginPath(); ctx.moveTo(ox, craftTop); ctx.lineTo(cx, cy + chuteR); ctx.stroke();

      // Canopy dome (half-ellipse)
      ctx.beginPath();
      ctx.ellipse(cx, cy, chuteR, chuteR * 0.65, 0, Math.PI, 0, true);
      ctx.closePath();
      const cg = ctx.createRadialGradient(cx, cy - chuteR * 0.3, 0, cx, cy, chuteR);
      cg.addColorStop(0, 'rgba(255,200,100,0.85)');
      cg.addColorStop(0.5, 'rgba(255,130,20,0.70)');
      cg.addColorStop(1, 'rgba(220,80,0,0.50)');
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,160,50,0.80)';
      ctx.lineWidth = 0.75 * sc;
      ctx.stroke();

      // Panel dividers inside canopy (4 ribs)
      for (let r = 1; r <= 3; r++) {
        const ang = Math.PI + (Math.PI / 4) * r;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * chuteR, cy + Math.sin(ang) * chuteR * 0.65);
        ctx.strokeStyle = 'rgba(180,80,0,0.35)';
        ctx.lineWidth = 0.5 * sc;
        ctx.stroke();
      }
    });

    // "CHUTES DEPLOYED" label — appears once chutes are open enough
    if (splashProg > 0.25) {
      const labelCx = ox + offsets[1][0], labelCy = craftTop + offsets[1][1] - chuteR * 0.8;
      ctx.font = `bold ${8 * sc}px Courier New`;
      ctx.fillStyle = 'rgba(255,180,60,0.85)';
      ctx.textAlign = 'center';
      ctx.fillText('CHUTES DEPLOYED', labelCx, labelCy - 4 * sc);
    }
  }

  const separated = (Date.now() - LAUNCH_EPOCH_MS) >= CM_SEP_MS;
  const img = separated ? getCmImg() : getCraftImg();
  const imgSize = 36 * sc;
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, ox - imgSize / 2, oy - imgSize / 2, imgSize, imgSize);
  } else {
    ctx.beginPath(); ctx.arc(ox, oy, 4 * sc, 0, Math.PI * 2);
    ctx.fillStyle = craftColor; ctx.fill();
  }

  ctx.restore(); // end zoom transform

  // ── Corner labels (screen space) ──
  ctx.font = `${13.5 * sc}px Courier New`; ctx.fillStyle = 'rgba(55,85,115,0.80)';
  ctx.textAlign = 'left';  ctx.fillText('ORBIT MAP', offX + 4, offY + 12 * sc);
  ctx.textAlign = 'right'; ctx.fillText('FREE-RETURN TRAJECTORY', W - offX - 4, offY + 12 * sc);

  // ── NEW: Mission progress bar (screen space, bottom) ──
  const totalPts = allAnim.length;
  const progressPct = Math.min(1, animIdx / (totalPts - 1));

  const barY  = H - 10;
  const barH  = 3;
  const barX  = offX + 20;
  const barW  = W - offX * 2 - 40;

  // Track
  rRect(ctx, barX, barY - 1, barW, barH + 2, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();

  // Fill gradient matches phase
  const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  barGrad.addColorStop(0,            '#00ff88');
  barGrad.addColorStop(n_ob / totalPts, '#00ff88');
  barGrad.addColorStop((n_ob + n_ml) / totalPts, '#00d4ff');
  barGrad.addColorStop((n_ob + n_ml + n_rp) / totalPts, '#00d4ff');
  barGrad.addColorStop(1, '#ff7722');
  ctx.fillStyle = barGrad;
  rRect(ctx, barX, barY - 1, barW * progressPct, barH + 2, 1); ctx.fill();

  // Phase tick marks
  const ticks = [
    { pct: n_ob / totalPts,           label: 'TLI'    },
    { pct: (n_ob + n_ml) / totalPts,  label: 'LUNAR'  },
    { pct: (n_ob + n_ml + n_rp) / totalPts, label: 'EI' },
  ];
  ctx.font = `${7 * sc}px Courier New`;
  ticks.forEach(({ pct, label }) => {
    const tx = barX + barW * pct;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(tx - 0.5, barY - 4, 1, barH + 4);
    ctx.fillStyle = 'rgba(200,220,240,0.35)';
    ctx.textAlign = 'center';
    ctx.fillText(label, tx, barY - 6);
  });

  // Progress dot
  const dotX = barX + barW * progressPct;
  ctx.beginPath(); ctx.arc(dotX, barY + barH / 2, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = craftColor;
  ctx.shadowColor = craftColor; ctx.shadowBlur = 6;
  ctx.fill();
  ctx.shadowBlur = 0;
}
