import avatar from '../bmac-avatar.jpg';
import qr     from '../bmac-qr.png';

const S = {
  overlay: {
    position:'fixed', inset:0, zIndex:10000,
    background:'rgba(0,0,0,0.55)',
    display:'flex', alignItems:'flex-start', justifyContent:'center',
    overflowY:'auto', padding:'0',
    animation:'bmacFadeIn 0.2s ease',
  },
  page: {
    width:'100%', maxWidth:'680px',
    background:'#f8f7f4',
    minHeight:'100vh',
    padding:'0 1rem 4rem',
    fontFamily:"'Nunito', sans-serif",
    animation:'bmacSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
  },
  topbar: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'1.2rem 0', marginBottom:'0.5rem',
  },
  bmcLogo: {
    display:'flex', alignItems:'center', gap:'0.4rem',
    fontWeight:800, fontSize:'1.1rem', color:'#111', textDecoration:'none',
    cursor:'default',
  },
  coffeeIcon: {
    width:30, height:30, background:'#FFDD00', borderRadius:8,
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem',
  },
  closeBtn: {
    width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'1.4rem', lineHeight:1, color:'#777',
    borderRadius:'50%', border:'1.5px solid #e0dbd4',
    background:'none', cursor:'pointer', transition:'background 0.15s, color 0.15s',
    flexShrink:0,
  },
  profileSection: {
    background:'#fff', borderRadius:16, padding:'2rem',
    border:'1.5px solid #f0ede8', marginBottom:'1.5rem',
    textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center',
  },
  avatar: {
    width:88, height:88, borderRadius:'50%', border:'4px solid #fff',
    objectFit:'cover', boxShadow:'0 2px 12px rgba(0,0,0,0.10)',
    display:'block', marginBottom:'1rem',
  },
  profileName:   { fontSize:'1.55rem', fontWeight:900, color:'#111', marginBottom:'0.25rem' },
  profileHandle: { fontSize:'0.85rem', color:'#888', fontWeight:600, marginBottom:'0.75rem' },
  profileBio:    { fontSize:'0.95rem', color:'#444', lineHeight:1.65, maxWidth:420, marginBottom:'1.2rem', fontWeight:600 },
  statsRow:      { display:'flex', gap:'1.2rem', flexWrap:'wrap', justifyContent:'center' },
  stat:          { display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.82rem', color:'#666', fontWeight:700 },
  statDot:       { width:6, height:6, borderRadius:'50%', background:'#FFDD00', border:'1.5px solid #daa900' },
  main:          { display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.5rem', alignItems:'start' },
  instrCard:     { background:'#fff', borderRadius:16, border:'1.5px solid #f0ede8', padding:'1.6rem' },
  cardTitle:     { fontSize:'1.05rem', fontWeight:900, color:'#111', marginBottom:'1.2rem', display:'flex', alignItems:'center', gap:'0.5rem' },
  step:          { display:'flex', gap:'0.9rem', marginBottom:'1rem', alignItems:'flex-start' },
  stepNum:       { minWidth:26, height:26, background:'#FFDD00', borderRadius:'50%', fontSize:'0.75rem', fontWeight:900, color:'#111', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  stepBody:      { fontSize:'0.88rem', color:'#333', lineHeight:1.6, fontWeight:600 },
  pillRow:       { display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.4rem' },
  pill:          { background:'#fff9d6', border:'1.5px solid #ffe44d', color:'#7a5f00', fontSize:'0.72rem', fontWeight:800, padding:'3px 9px', borderRadius:20, whiteSpace:'nowrap' },
  divider:       { height:1, background:'#f0ede8', margin:'1.2rem 0' },
  noteBox:       { background:'#fffbea', border:'1.5px solid #ffe44d', borderRadius:10, padding:'0.9rem 1rem', fontSize:'0.82rem', color:'#7a5f00', fontWeight:700, lineHeight:1.6 },
  payCard:       { background:'#fff', borderRadius:16, border:'1.5px solid #f0ede8', padding:'1.6rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem' },
  payTitle:      { fontSize:'1rem', fontWeight:900, color:'#111', textAlign:'center' },
  qrWrap:        { background:'#fff', border:'2px solid #f0ede8', borderRadius:14, padding:12, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'inline-flex', alignItems:'center', justifyContent:'center' },
  qrImg:         { width:220, height:220, display:'block', objectFit:'contain' },
  upiBadge:      { background:'#f8f7f4', border:'1.5px solid #e8e4de', borderRadius:10, padding:'0.6rem 1rem', textAlign:'center', width:'100%' },
  upiLabel:      { fontSize:'0.7rem', color:'#999', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem' },
  upiValue:      { fontSize:'0.88rem', color:'#111', fontWeight:800 },
  orDivider:     { display:'flex', alignItems:'center', gap:'0.75rem', width:'100%', fontSize:'0.8rem', color:'#aaa', fontWeight:700 },
  orLine:        { flex:1, height:1, background:'#f0ede8' },
  payCta:        { width:'100%', background:'#FFDD00', color:'#111', fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:'1rem', padding:'0.75rem 1.5rem', borderRadius:12, border:'none', cursor:'pointer', textDecoration:'none', textAlign:'center', display:'block', transition:'transform 0.1s' },
  scanHint:      { fontSize:'0.75rem', color:'#aaa', fontWeight:700, textAlign:'center', lineHeight:1.5 },
};

export default function BmacModal({ onClose }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes bmacFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes bmacSlideUp { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:translateY(0) } }
        .bmac-close:hover { background:#f0ede8 !important; color:#111 !important; }
        .bmac-cta:hover   { transform:scale(1.02); }
        @media(max-width:600px) {
          .bmac-main { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={S.overlay} onClick={onClose}>
        <div style={S.page} onClick={e => e.stopPropagation()}>

          {/* Topbar */}
          <div style={S.topbar}>
            <div style={S.bmcLogo}>
              <div style={S.coffeeIcon}>☕</div>
              Buy Me a Coffee
            </div>
            <button className="bmac-close" style={S.closeBtn} onClick={onClose}>×</button>
          </div>

          {/* Profile */}
          <div style={S.profileSection}>
            <img style={S.avatar} src={avatar} alt="Krishna Raj" />
            <div style={S.profileName}>Krishna Raj</div>
            <div style={S.profileHandle}>
              @krishnaraj · Bangalore, India &nbsp;·&nbsp;{' '}
              <a href="https://www.linkedin.com/in/krishnaraj-m-e-97389a162" target="_blank" rel="noopener noreferrer" style={{color:'#0a66c2',fontWeight:700,textDecoration:'none'}}>LinkedIn ↗</a>
            </div>
            <p style={S.profileBio}>
              UX Designer &amp; Co-founder building products people love. If something I made helped you — a design, a tool, a side project — buy me a coffee! Every cup keeps the ideas brewing. ☕
            </p>
            <div style={S.statsRow}>
              {['UPI Payments Supported','Instant Transfer','International Friendly'].map(t => (
                <div key={t} style={S.stat}><div style={S.statDot}></div>{t}</div>
              ))}
            </div>
          </div>

          {/* Main grid */}
          <div className="bmac-main" style={S.main}>

            {/* Left: Instructions */}
            <div style={S.instrCard}>
              <div style={S.cardTitle}>🌍 International? Here's how to send</div>

              {[
                { n:'1', body: <><strong>Open a transfer app</strong> that supports UPI payments to India<div style={S.pillRow}>{['Wise','Remitly','Xoom','Western Union'].map(p=><span key={p} style={S.pill}>{p}</span>)}</div></> },
                { n:'2', body: <>Choose <strong>"Send to India → UPI ID"</strong> as delivery method</> },
                { n:'3', body: <>Enter UPI ID: <strong>krishnarajme.info@okicici</strong><br/>Name: <strong>Krishna Raj</strong></> },
                { n:'4', body: <>Enter amount in <strong>your local currency</strong> — auto-converts to ₹</> },
                { n:'5', body: <>Confirm &amp; send! Arrives in <strong>minutes</strong> ⚡</> },
              ].map(({ n, body }) => (
                <div key={n} style={{ ...S.step, marginBottom: n === '5' ? 0 : '1rem' }}>
                  <div style={S.stepNum}>{n}</div>
                  <div style={S.stepBody}>{body}</div>
                </div>
              ))}

              <div style={S.divider} />
              <div style={S.noteBox}>
                ☕ 1 Coffee ≈ ₹200 (~$2.50 USD / €2.30 EUR / £2 GBP)<br/>
                No UPI account needed from your side. Straight to my bank. Thank you! 🙏
              </div>
            </div>

            {/* Right: QR + Pay */}
            <div style={S.payCard}>
              <div style={S.payTitle}>Pay with UPI</div>
              <div style={S.qrWrap}>
                <img style={S.qrImg} src={qr} alt="UPI QR Code" />
              </div>
              <div style={S.upiBadge}>
                <div style={S.upiLabel}>UPI ID / VPA</div>
                <div style={S.upiValue}>krishnarajme.info@okicici</div>
              </div>
              <div style={S.orDivider}>
                <div style={S.orLine}/> or <div style={S.orLine}/>
              </div>
              <a className="bmac-cta" style={S.payCta} href="upi://pay?pa=krishnarajme.info@okicici&pn=Krishna%20Raj&cu=INR">
                ☕ Buy Me a Coffee
              </a>
              <div style={S.scanHint}>Scan QR with Google Pay, PhonePe,<br/>Paytm or any UPI app</div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
