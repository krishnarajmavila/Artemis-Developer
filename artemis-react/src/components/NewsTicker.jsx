import { useState, useEffect, useRef } from 'react';

// Spaceflight News API — free, no proxy, CORS-enabled, aggregates NASASpaceFlight.com, SpaceNews, etc.
// /articles/ = full news pieces; /blogs/ = shorter live-updates (mission events during active flights)
const SNAPI_ARTICLES = 'https://api.spaceflightnewsapi.net/v4/articles/?search=artemis+OR+orion+spacecraft+OR+lunar+gateway&limit=20&ordering=-published_at';
const SNAPI_BLOGS    = 'https://api.spaceflightnewsapi.net/v4/blogs/?search=artemis+OR+orion&limit=20&ordering=-published_at';
// NASA Artemis live blog (via rss2json proxy) — posts mission event updates during active flights
// e.g. "MCC-5 burn complete", "EI in T-24h" — only active when a mission is flying
const RSS_PROXY     = 'https://api.rss2json.com/v1/api.json?rss_url=';
const NASA_BLOG_RSS = 'https://blogs.nasa.gov/artemis/feed/';

const REFRESH_MS  = 10 * 60 * 1000; // 10 min
const PX_PER_SEC  = 55;

function fmt(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NewsTicker() {
  const [items,  setItems]  = useState([]);
  const [paused, setPaused] = useState(false);
  const [source, setSource] = useState('');
  const trackRef            = useRef(null);

  async function fetchAll() {
    // Today's cutoff — midnight local time
    const todayCutoff = new Date();
    todayCutoff.setHours(0, 0, 0, 0);
    // 48-hour fallback cutoff in case today has nothing yet
    const fallbackCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [articlesRes, blogsRes, nasaBlogRes] = await Promise.allSettled([
      // Primary: SNAPI articles — full news from multiple outlets
      fetch(SNAPI_ARTICLES)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(d => (d.results || []).map(i => ({
          title:   i.title,
          link:    i.url,
          pubDate: i.published_at,
          _src:    (i.news_site || 'SPACEFLIGHT').toUpperCase().slice(0, 14),
        }))),
      // Secondary: SNAPI blogs — shorter live updates, active during missions
      // This is the source for "Homeward bound / MCC-5 burn complete" style events
      fetch(SNAPI_BLOGS)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(d => (d.results || []).map(i => ({
          title:   i.title,
          link:    i.url,
          pubDate: i.published_at,
          _src:    (i.news_site || 'MISSION UPDATE').toUpperCase().slice(0, 14),
        }))),
      // Tertiary: NASA Artemis live blog RSS — mission event posts during active flights
      fetch(`${RSS_PROXY}${encodeURIComponent(NASA_BLOG_RSS)}`)
        .then(r => r.json())
        .then(d => (d.items || []).map(i => ({ ...i, _src: 'NASA ARTEMIS' }))),
    ]);

    const combined = [
      ...(articlesRes.status  === 'fulfilled' ? articlesRes.value  : []),
      ...(blogsRes.status     === 'fulfilled' ? blogsRes.value     : []),
      ...(nasaBlogRes.status  === 'fulfilled' ? nasaBlogRes.value  : []),
    ]
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .filter((item, idx, arr) => arr.findIndex(x => x.title === item.title) === idx);

    // Prefer today's articles; fall back to last 48h if today is empty
    let todayItems = combined.filter(i => !i.pubDate || new Date(i.pubDate) >= todayCutoff);
    const all = (todayItems.length >= 3 ? todayItems : combined.filter(i => !i.pubDate || new Date(i.pubDate) >= fallbackCutoff))
      .slice(0, 28);

    if (all.length) {
      setItems(all);
      const srcSet = [...new Set(all.map(i => i._src))].slice(0, 3).join(' · ');
      setSource(srcSet);
    }
  }

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  // Recalculate animation duration when items change
  useEffect(() => {
    if (!trackRef.current || !items.length) return;
    requestAnimationFrame(() => {
      if (!trackRef.current) return;
      const w = trackRef.current.scrollWidth / 2;
      const dur = Math.round(w / PX_PER_SEC);
      trackRef.current.style.animationDuration = `${dur}s`;
    });
  }, [items]);

  const doubled = [...items, ...items];

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0) }
          to   { transform: translateX(-50%) }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          white-space: nowrap;
          will-change: transform;
          animation: ticker-scroll 90s linear infinite;
        }
        .ticker-track.paused { animation-play-state: paused; }
        .ticker-item:hover { color: #00d4ff !important; }
        .ticker-item:hover .ticker-title { text-decoration: underline; }
      `}</style>

      <div
        className="news-ticker"
        style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--bg2)', borderTop: '1px solid var(--border)',
          overflow: 'hidden', position: 'relative',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Static label */}
        <div style={{
          flexShrink: 0, padding: '0 10px',
          borderRight: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '5px',
          height: '100%', background: 'var(--bg3)', zIndex: 1,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3b3b', display: 'inline-block', animation: 'blink 1.5s infinite' }} />
          <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '1.5px', fontFamily: 'Courier New,monospace' }}>NEWS</span>
        </div>

        {/* Scrolling track */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
          {!items.length ? (
            <span style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '1px', paddingLeft: '14px', fontFamily: 'Courier New,monospace' }}>
              CONNECTING TO SPACEFLIGHT NEWS...
            </span>
          ) : (
            <div ref={trackRef} className={`ticker-track${paused ? ' paused' : ''}`}>
              {doubled.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ticker-item"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    textDecoration: 'none', color: 'var(--text2)',
                    padding: '0 18px',
                    borderRight: '1px solid var(--border)',
                    fontSize: '11px', height: '28px',
                    transition: 'color 0.15s',
                  }}
                >
                  <span style={{ fontSize: '8px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px', fontFamily: 'Courier New,monospace', flexShrink: 0 }}>
                    {item._src}
                  </span>
                  <span className="ticker-title" style={{ color: 'rgba(190,210,235,0.85)', fontWeight: 600 }}>
                    {item.title}
                  </span>
                  {item.pubDate && (
                    <span style={{ fontSize: '9px', color: 'var(--text3)', flexShrink: 0 }}>
                      {fmt(item.pubDate)}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Source tag (right side, before fade) */}
        {source && (
          <div style={{
            position: 'absolute', right: '44px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '7px', color: 'var(--text3)', letterSpacing: '0.5px',
            pointerEvents: 'none', zIndex: 2, whiteSpace: 'nowrap',
          }}>
            {source}
          </div>
        )}

        {/* Right fade */}
        <div style={{
          position: 'absolute', right: 0, top: 0, width: '80px', height: '100%',
          background: 'linear-gradient(to right, transparent, var(--bg2))',
          pointerEvents: 'none', zIndex: 1,
        }} />
      </div>
    </>
  );
}
