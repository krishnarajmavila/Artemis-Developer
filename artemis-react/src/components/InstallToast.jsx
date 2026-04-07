import { useState, useEffect, useRef } from 'react';

const DISMISSED_KEY = 'a2_install_dismissed';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMobile() {
  return window.innerWidth < 900 || /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallToast() {
  const [visible, setVisible]   = useState(false);
  const [iosGuide, setIosGuide] = useState(false);
  const promptRef               = useRef(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (!isMobile()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    function onBeforeInstall(e) {
      e.preventDefault();
      promptRef.current = e;
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    const timer = setTimeout(() => setVisible(true), 2500);
    window.addEventListener('appinstalled', dismiss);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', dismiss);
    };
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
    setIosGuide(false);
  }

  async function handleInstall() {
    if (promptRef.current) {
      promptRef.current.prompt();
      const { outcome } = await promptRef.current.userChoice;
      if (outcome === 'accepted') { dismiss(); return; }
      promptRef.current = null;
    } else if (isIOS()) {
      setIosGuide(true);
      return;
    } else {
      alert('Open your browser menu and tap "Add to Home Screen" or "Install app".');
    }
    dismiss();
  }

  if (!visible) return null;

  return (
    <>
      <div style={{
        position:'fixed', bottom:'16px', left:'50%', transform:'translateX(-50%)',
        zIndex:9999, width:'min(94vw,380px)',
        background:'rgb(89 54 107)', border:'1px solid rgba(0,212,255,0.3)',
        borderRadius:'8px', boxShadow:'0 6px 32px rgba(0,0,0,0.8)',
        padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px',
        animation:'a2up 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <img src="/icon-192.png" alt="" style={{width:'42px',height:'42px',borderRadius:'10px',flexShrink:0}} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:'11px',fontWeight:'700',color:'#00d4ff',letterSpacing:'1.5px',fontFamily:'Courier New,monospace'}}>ARTEMIS II</div>
          <div style={{fontSize:'10px',color:'rgba(190,210,235,0.75)',marginTop:'2px'}}>Install mission control on your device</div>
        </div>
        <div style={{display:'flex',gap:'6px',flexShrink:0}}>
          <button onClick={dismiss} style={btn('ghost')}>NOT NOW</button>
          <button onClick={handleInstall} style={btn('primary')}>{isIOS()?'HOW TO':'INSTALL'}</button>
        </div>
        <style>{`@keyframes a2up{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      </div>

      {iosGuide && (
        <div style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={dismiss}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:'480px',background:'#0f1120',border:'1px solid rgba(0,212,255,0.25)',borderRadius:'12px 12px 0 0',padding:'20px 20px 32px',animation:'a2up 0.3s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <span style={{fontSize:'12px',fontWeight:'700',color:'#00d4ff',letterSpacing:'2px',fontFamily:'Courier New,monospace'}}>ADD TO HOME SCREEN</span>
              <button onClick={dismiss} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:'20px',cursor:'pointer'}}>×</button>
            </div>
            {[['1','Tap the Share button','⬆ at the bottom of Safari'],['2','Scroll down and tap','"Add to Home Screen"'],['3','Tap "Add"','in the top-right corner']].map(([n,t,s])=>(
              <div key={n} style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'14px'}}>
                <div style={{width:'24px',height:'24px',borderRadius:'50%',background:'#00d4ff',color:'#0b0d18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',flexShrink:0,fontFamily:'Courier New,monospace'}}>{n}</div>
                <div><div style={{fontSize:'12px',color:'#fff',fontWeight:'600'}}>{t}</div><div style={{fontSize:'10px',color:'rgba(190,210,235,0.6)',marginTop:'2px'}}>{s}</div></div>
              </div>
            ))}
            <button onClick={dismiss} style={{...btn('primary'),width:'100%',marginTop:'4px',justifyContent:'center'}}>GOT IT</button>
          </div>
        </div>
      )}
    </>
  );
}

function btn(variant) {
  const base = {fontSize:'9px',fontFamily:'Courier New,monospace',letterSpacing:'1px',borderRadius:'3px',padding:'5px 10px',cursor:'pointer',display:'inline-flex',alignItems:'center'};
  return variant==='primary'
    ? {...base,background:'#00d4ff',color:'#0b0d18',fontWeight:'700',border:'none'}
    : {...base,background:'transparent',color:'rgba(150,170,190,0.7)',border:'1px solid rgba(255,255,255,0.1)'};
}
