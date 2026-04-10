// MET format: days/HH:MM  — sourced from NASA Artemis II Overview Timeline (Jan 8 2026, public release)

export const milestonesData = [
  // FD01 — Ascent & LEO
  { label: 'Launch / Liftoff',          met: '0/00:00', type: 'burn',  fd: 1 },
  { label: 'ICPS Perigee Raise Burn',   met: '0/00:50', type: 'burn',  fd: 1 },
  { label: 'ARB TIG',                   met: '0/01:48', type: 'burn',  fd: 1 },
  { label: 'Orion / ICPS Separation',   met: '0/03:24', type: 'key',   fd: 1 },
  { label: 'ICPS Disposal Burn',        met: '0/05:02', type: 'burn',  fd: 1 },
  { label: 'Solar Array Deploy',        met: '0/05:27', type: 'key',   fd: 1 },
  // FD02 — High Earth Orbit → TLI
  { label: 'Trans-Lunar Injection',     met: '1/01:37', type: 'burn',  fd: 2 },
  { label: 'CM / SM Survey',            met: '1/12:00', type: 'obs',   fd: 2 },
  // FD03 — Trans-Lunar
  { label: 'OTC-1 Correction Burn',     met: '2/00:07', type: 'burn',  fd: 3 },
  // FD04 — Trans-Lunar
  { label: 'OTC-2 Correction Burn',     met: '3/00:12', type: 'burn',  fd: 4 },
  // FD05 — Near Moon
  { label: 'OTC-3 Correction Burn',     met: '4/05:23', type: 'burn',  fd: 5 },
  { label: 'Lunar SOI Entry',           met: '4/06:59', type: 'key',   fd: 5 },
  { label: 'Apollo 13 Distance Record', met: '4/21:02', type: 'record',fd: 5 },
  { label: 'Lunar Close Approach',      met: '5/01:23', type: 'key',   fd: 6 },
  { label: 'Max Earth Distance',        met: '5/01:27', type: 'record',fd: 6 },
  { label: 'CM / SM Survey #2',         met: '5/12:45', type: 'obs',   fd: 6 },
  // FD06 — Trans-Earth begins
  { label: 'Lunar SOI Exit',            met: '5/19:47', type: 'key',   fd: 6 },
  { label: 'RTC-1 Correction Burn',     met: '6/04:23', type: 'burn',  fd: 7 },
  // FD08 — Trans-Earth
  { label: 'RTC-2 Correction Burn',     met: '8/04:33', type: 'burn',  fd: 9 },
  // FD09 — Entry Prep
  { label: 'RTC-3 Correction Burn',     met: '8/20:33', type: 'burn',  fd: 9 },
  // FD10 — EDL
  { label: 'CM / SM Separation',        met: '9/01:13', type: 'key',   fd: 10 },
  { label: 'Entry Interface',           met: '9/01:33', type: 'burn',  fd: 10 },
  { label: 'Splashdown',               met: '9/01:46', type: 'splash', fd: 10 },
];

// Per-flight-day overview — phases and key narrative from NASA PDF
export const flightDays = [
  { fd: 1,  phase: 'ASCENT / LEO',       color: '#dd5200', events: ['Launch & Ascent', 'ICPS Burns', 'Orion Sep', 'Solar Array Deploy', 'Crew suit doff', 'Prox Ops Demo'] },
  { fd: 2,  phase: 'HIGH EARTH ORBIT',   color: '#0088bb', events: ['HEO Systems Checkout', 'Trans-Lunar Injection', 'CM/SM Survey', 'Crew PAO'] },
  { fd: 3,  phase: 'TRANS-LUNAR',        color: '#7722cc', events: ['OTC-1 Burn', 'OpNav', 'Acoustic monitoring begins', 'FTO Operations'] },
  { fd: 4,  phase: 'TRANS-LUNAR',        color: '#7722cc', events: ['OTC-2 Burn', '24-hr Acoustic DFTO', 'Nav FTO', 'CSA Science'] },
  { fd: 5,  phase: 'LUNAR APPROACH',     color: '#00aa66', events: ['OTC-3 Burn', 'Lunar SOI Entry', 'OCSS Suit Demo', 'SAT Mode Test'] },
  { fd: 6,  phase: 'LUNAR FLYBY',        color: '#00cc88', events: ['Apollo 13 Record', 'Lunar Close Approach', 'Max Earth Distance', 'SOI Exit', 'RTC-1 Burn'] },
  { fd: 7,  phase: 'TRANS-EARTH',        color: '#0088bb', events: ['Crew Off Duty Day', 'FCS Checkouts', 'Personal Family Conf', 'RTCS Demo'] },
  { fd: 8,  phase: 'TRANS-EARTH',        color: '#0088bb', events: ['Manual Pilot DFTO', 'Radiation Shelter Demo', 'Entry Systems Review', 'Crew Rest'] },
  { fd: 9,  phase: 'ENTRY PREP',         color: '#cc6600', events: ['RTC-2 Burn', 'RTC-3 Burn', 'Entry Conference', 'OIG Don DFTO', 'Entry Stow', 'Crew Sleep Shift'] },
  { fd: 10, phase: 'EDL / RECOVERY',     color: '#cc2200', events: ['CM/SM Separation', 'Entry Interface', 'Splashdown', 'Recovery Ops'] },
];

export const healthItems = [
  { name: 'ECLSS', status: 'NOM', ok: true  },
  { name: 'GNC',   status: 'NOM', ok: true  },
  { name: 'COMM',  status: 'NOM', ok: true  },
  { name: 'EPS',   status: 'NOM', ok: true  },
  { name: 'TCS',   status: 'NOM', ok: true  },
  { name: 'DPS',   status: 'NOM', ok: true  },
  { name: 'OMS-E', status: 'SBY', ok: null  },
  { name: 'RCS',   status: 'NOM', ok: true  },
];
