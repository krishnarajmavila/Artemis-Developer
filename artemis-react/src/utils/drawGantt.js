import { GC, ganttActs, ganttAtt, ganttPhases } from '../data/ganttData.js';
import { LAUNCH_EPOCH_MS } from './index.js';

const GANTT_PPH   = 20;
const GANTT_TOTAL = 226;
const GANTT_RH    = 50;
const GANTT_RA    = 85;
const GANTT_RB    = 50;
const GANTT_RC    = 45;
const GANTT_H     = GANTT_RH + GANTT_RA + GANTT_RB + GANTT_RC;

function ganttRowDraw(ctx, items, y, h, fs, pph, xOffset) {
  items.forEach(item => {
    const col = item.k ? GC[item.k] : [item.c, item.b];
    const x = xOffset + Math.floor(item.h0 * pph);
    const w = Math.max(1, Math.floor((item.h1 - item.h0) * pph));
    ctx.fillStyle   = col[0];
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = col[1];
    ctx.lineWidth   = 0.75;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    if (w > 22) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x + 2, y + 1, w - 4, h - 2); ctx.clip();
      ctx.fillStyle = 'rgba(210,228,248,0.90)';
      ctx.font = `${fs * 1.5}px "Courier New",monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(item.l, x + 4, y + h * 0.70);
      ctx.restore();
    }
  });
}

export function drawGantt(canvas) {
  if (!canvas) return;

  let pph = GANTT_PPH;
  if (window.innerWidth < 720) pph = 5;
  else if (window.innerWidth < 1100) pph = 16;

  const W = GANTT_TOTAL * pph;
  canvas.width  = W;
  canvas.height = GANTT_H;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#080c16';
  ctx.fillRect(0, 0, W, GANTT_H);

  const metH = (Date.now() - LAUNCH_EPOCH_MS) / 3600000;
  const HOUR_OFFSET = 7;
  const xOffsetPx = HOUR_OFFSET * pph;

  ctx.fillStyle = '#060a12';
  ctx.fillRect(0, 0, W, GANTT_RH);

  for (let fd = 1; fd <= 10; fd++) {
    const fdStartHour = -7 + (fd - 1) * 24;
    const x = xOffsetPx + (fdStartHour * pph);
    ctx.strokeStyle = '#1e3050'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GANTT_H); ctx.stroke();
    ctx.fillStyle = '#5a8aaa';
    ctx.font = '15px "Courier New",monospace';
    ctx.textAlign = 'left';
    ctx.fillText(fd < 10 ? `FD0${fd}` : `FD${fd}`, x + 3, GANTT_RH - 4);
  }

  ctx.strokeStyle = '#111c2a'; ctx.lineWidth = 0.5;
  for (let h = -7; h < GANTT_TOTAL - 7; h += 6) {
    if (h % 24 !== 0 && (h + 7) % 24 !== 0) {
      const x = xOffsetPx + (h * pph);
      ctx.beginPath(); ctx.moveTo(x, GANTT_RH - 5); ctx.lineTo(x, GANTT_H); ctx.stroke();
    }
  }

  ganttRowDraw(ctx, ganttActs,   GANTT_RH,                        GANTT_RA, 9, pph, xOffsetPx);
  ganttRowDraw(ctx, ganttAtt,    GANTT_RH + GANTT_RA,             GANTT_RB, 8, pph, xOffsetPx);
  ganttRowDraw(ctx, ganttPhases, GANTT_RH + GANTT_RA + GANTT_RB,  GANTT_RC, 8, pph, xOffsetPx);

  ctx.strokeStyle = '#182030'; ctx.lineWidth = 1;
  [GANTT_RH + GANTT_RA, GANTT_RH + GANTT_RA + GANTT_RB].forEach(y => {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  });

  if (metH >= -7 && metH <= GANTT_TOTAL - 7 + 0.5) {
    const nx = xOffsetPx + Math.floor(metH * pph);
    ctx.strokeStyle = 'rgba(0,255,136,0.85)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.moveTo(nx, 0); ctx.lineTo(nx, GANTT_H); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#00ff88';
    ctx.beginPath(); ctx.moveTo(nx - 5, 0); ctx.lineTo(nx + 5, 0); ctx.lineTo(nx, 9); ctx.closePath(); ctx.fill();
  }
}

export function ganttScrollToNow(wrap) {
  if (!wrap) return;
  const metH = (Date.now() - LAUNCH_EPOCH_MS) / 3600000;
  let pph = GANTT_PPH;
  if (window.innerWidth < 720) pph = 5;
  else if (window.innerWidth < 1100) pph = 16;
  const nowX = (7 + metH) * pph;
  wrap.scrollLeft = Math.max(0, nowX - wrap.clientWidth * 0.25);
}

export function drawVelGraph(canvas, velHistoryRef, val) {
  if (!canvas) return;
  velHistoryRef.current.push(val);
  if (velHistoryRef.current.length > 60) velHistoryRef.current.shift();
  const W = canvas.offsetWidth || 200, H = 40;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const hist = velHistoryRef.current;
  if (hist.length < 2) return;
  const mn = Math.min(...hist) - 50, mx = Math.max(...hist) + 50;
  ctx.beginPath();
  hist.forEach((v, i) => {
    const x = (i / (hist.length - 1)) * W;
    const y = H - ((v - mn) / (mx - mn)) * H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = 'rgba(0,212,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = 'rgba(0,212,255,0.08)'; ctx.fill();
}
