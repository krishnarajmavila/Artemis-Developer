export const LAUNCH_EPOCH_MS = 1775082912000; // 2026-04-01T22:35:12Z

export function pad(n, w = 2) {
  return String(Math.floor(n)).padStart(w, '0');
}

export function formatMET(s) {
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); const sc = s % 60;
  return `${pad(d, 3)}:${pad(h)}:${pad(m)}:${pad(sc)}`;
}

export function getRealMetSeconds() {
  return Math.floor((Date.now() - LAUNCH_EPOCH_MS) / 1000);
}

export function metToHours(metStr) {
  const parts = metStr.split('/');
  if (parts.length !== 2) return 0;
  const days = parseInt(parts[0]) || 0;
  const timeParts = parts[1].split(':');
  const hours = parseInt(timeParts[0]) || 0;
  const minutes = parseInt(timeParts[1]) || 0;
  return days * 24 + hours + minutes / 60;
}

export function computeMilestones(metH, milestonesData) {
  let foundNext = false;
  return milestonesData.map(m => {
    const mHours = metToHours(m.met);
    if (metH >= mHours) {
      return { ...m, done: true, current: false };
    } else if (!foundNext) {
      foundNext = true;
      return { ...m, done: false, current: true };
    } else {
      return { ...m, done: false, current: false };
    }
  });
}

export function computeNextEvent(metH, milestones) {
  const next = milestones.find(m => !m.done);
  if (!next) return { label: 'Mission Complete', timeStr: '' };
  const nextHours = metToHours(next.met);
  const remaining = Math.max(0, (nextHours - metH) * 3600);
  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const mn = Math.floor((remaining % 3600) / 60);
  const s = Math.floor(remaining % 60);
  const timeStr = d > 0
    ? `T-${d}d ${pad(h)}:${pad(mn)}:${pad(s)}`
    : `T-${h}:${pad(mn)}:${pad(s)}`;
  return { label: next.label, timeStr };
}

export function computeNextBurn(metH, milestones) {
  const { label, timeStr } = computeNextEvent(metH, milestones);
  return timeStr ? `${label} ${timeStr}` : label;
}

export function getActiveItem(items, metH) {
  return items.find(it => metH >= it.h0 && metH < it.h1) || null;
}

export function computePhase(metH) {
  if (metH < 25.3) return metH < 2 ? 'LEO' : 'HIGH EARTH';
  if (metH < 115.3) return 'TRANS-LUNAR';
  if (metH < 209.3) return 'TRANS-EARTH';
  return 'EDL';
}

export function computeFD(metH) {
  const fd = Math.floor((metH + 7) / 24) + 1;
  return `FD${String(Math.min(10, Math.max(1, fd))).padStart(2, '0')}`;
}
