import { healthItems } from '../data/milestones.js';
import PhotoSlider from './PhotoSlider.jsx';

export default function RightPanel({ disp }) {
  return (
    <div className="mc-panel">
      <div className="panel-title" style={{display:'flex',alignItems:'center',gap:'6px'}}>
        NASA Live
        <span style={{
          background:'#ff3b3b',color:'#fff',fontSize:'8px',fontWeight:'700',
          letterSpacing:'2px',padding:'1px 5px',borderRadius:'2px',
          animation:'blink 1.5s infinite'
        }}>&#9679; LIVE</span>
      </div>
      <div style={{
        background:'#000',border:'1px solid var(--border2)',borderRadius:'4px',
        overflow:'hidden',position:'relative',paddingTop:'56.25%'
      }}>
        <iframe
          src="https://www.youtube.com/embed/m3kR2KK8TEs?autoplay=1&mute=1&rel=0&modestbranding=1"
          title="NASA Live"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}
        />
      </div>
      <div style={{fontSize:'8px',color:'var(--text3)',marginTop:'3px',letterSpacing:'1px',textAlign:'right',marginBottom:'10px'}}>
        SOURCE: NASA TV PUBLIC CHANNEL
      </div>

      <PhotoSlider />

      <div className="panel-title">Mission Milestones</div>
      <div className="milestone-list">
        {disp.milestones.map((m, i) => {
          const cls = m.current ? 'current' : m.done ? 'done' : 'upcoming';
          return (
            <div className="milestone-item" key={i}>
              <div className={`ms-dot ${cls}`}></div>
              <div>
                <div className={`ms-text ${cls}`}>{m.label}</div>
                <div className="ms-time">MET {m.met}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel-title" style={{marginTop:'10px'}}>Telemetry Health</div>
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'4px',padding:'8px'}}>
        {healthItems.map((h, i) => {
          const col = h.ok === null ? 'var(--warn)' : h.ok ? 'var(--success)' : 'var(--danger)';
          return (
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'2px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:'9px',color:'var(--text2)'}}>{h.name}</span>
              <span style={{fontSize:'9px',fontWeight:'700',color:col}}>{h.status}</span>
            </div>
          );
        })}
      </div>

      <div className="panel-title" style={{marginTop:'10px'}}>Comm Link Quality</div>
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'4px',padding:'8px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
          <span style={{fontSize:'9px',color:'var(--text2)'}}>Signal strength</span>
          <span style={{fontSize:'9px',color:'var(--success)'}}>{disp.sigStrength} dBm</span>
        </div>
        <div style={{height:'4px',background:'var(--bg4)',borderRadius:'2px',marginBottom:'6px'}}>
          <div style={{height:'100%',background:'var(--success)',borderRadius:'2px',width:`${disp.sigBarW}%`,transition:'width 1s'}}></div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
          <span style={{fontSize:'9px',color:'var(--text2)'}}>Round-trip light time</span>
          <span style={{fontSize:'9px',color:'var(--accent)'}}>{disp.lightTime} s</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <span style={{fontSize:'9px',color:'var(--text2)'}}>Bit error rate</span>
          <span style={{fontSize:'9px',color:'var(--success)'}}>10&sup1;&sup8;</span>
        </div>
      </div>

      <div className="panel-title" style={{marginTop:'10px'}}>ESM Power Systems</div>
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'4px',padding:'8px'}}>
        {disp.saws.map((val, i) => (
          <div style={{marginBottom:'5px'}} key={i}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'9px',marginBottom:'2px'}}>
              <span style={{color:'var(--text2)'}}>SAW-{i+1}</span>
              <span style={{color: i === 3 ? 'var(--warn)' : 'var(--success)'}}>{val.toFixed(1)} kW</span>
            </div>
            <div style={{height:'3px',background:'var(--bg4)',borderRadius:'1px'}}>
              <div style={{height:'100%',background: i === 3 ? 'var(--warn)' : 'var(--success)',borderRadius:'1px',width:`${(val/12.5*100).toFixed(0)}%`,transition:'width 1s'}}></div>
            </div>
          </div>
        ))}
        <div style={{marginTop:'6px',fontSize:'8px',color:'var(--text3)'}}>
          TOTAL OUTPUT: <span style={{color:'var(--success)'}}>{disp.totalPower} kW</span>
        </div>
      </div>

    </div>
  );
}
