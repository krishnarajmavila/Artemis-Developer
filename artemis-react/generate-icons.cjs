// Generates icon-192.png and icon-512.png using only Node.js built-ins
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function writePNG(filePath, size) {
  const W = size, H = size;
  function byte(n) { return n & 0xff; }
  function u32be(n) { return [(n>>>24)&0xff,(n>>>16)&0xff,(n>>>8)&0xff,n&0xff]; }
  function crc32(buf) {
    let c = 0xffffffff;
    const t = new Uint32Array(256);
    for (let i=0;i<256;i++){let x=i;for(let j=0;j<8;j++)x=x&1?(0xedb88320^(x>>>1)):(x>>>1);t[i]=x;}
    for (const b of buf) c=t[(c^b)&0xff]^(c>>>8);
    return (c^0xffffffff)>>>0;
  }
  function chunk(type, data) {
    const typeBytes = [...type].map(c=>c.charCodeAt(0));
    const len = u32be(data.length);
    const crcBuf = [...typeBytes, ...data];
    return [...len, ...typeBytes, ...data, ...u32be(crc32(crcBuf))];
  }

  // Draw pixels
  const pixels = new Uint8Array(W * H * 4);
  const cx = W/2, cy = H/2;
  const r = size;

  function setPixel(x, y, rr, g, b, a=255) {
    if (x<0||x>=W||y<0||y>=H) return;
    const i=(y*W+x)*4;
    pixels[i]=rr; pixels[i+1]=g; pixels[i+2]=b; pixels[i+3]=a;
  }
  function fillRect(x1,y1,x2,y2,rr,g,b,a=255){
    for(let y=y1;y<y2;y++) for(let x=x1;x<x2;x++) setPixel(x,y,rr,g,b,a);
  }
  function fillCircle(ccx,ccy,rad,rr,g,b,a=255){
    for(let y=Math.floor(ccy-rad);y<=Math.ceil(ccy+rad);y++)
      for(let x=Math.floor(ccx-rad);x<=Math.ceil(ccx+rad);x++)
        if((x-ccx)**2+(y-ccy)**2<=rad**2) setPixel(x,y,rr,g,b,a);
  }

  const s = size/512;

  // Background (rounded rect via fill all + corner mask)
  fillRect(0,0,W,H, 11,13,24,255);
  // Round corners
  const rad = Math.round(80*s);
  for(let y=0;y<rad;y++) for(let x=0;x<rad;x++) {
    const dist = Math.sqrt((rad-x)**2+(rad-y)**2);
    if(dist>rad){ setPixel(x,y,0,0,0,0); setPixel(W-1-x,y,0,0,0,0); setPixel(x,H-1-y,0,0,0,0); setPixel(W-1-x,H-1-y,0,0,0,0); }
  }

  // Earth
  const ecx=Math.round(256*s), ecy=Math.round(310*s), er=Math.round(80*s);
  fillCircle(ecx,ecy,er, 26,58,107);

  // Orbit ellipse (draw as dotted ring — approximate with circle outline)
  const orx=Math.round(160*s), ory=Math.round(90*s), ocy=Math.round(290*s);
  for(let t=0;t<6283;t++){
    const angle=t/1000;
    const px=Math.round(ecx+orx*Math.cos(angle));
    const py=Math.round(ocy+ory*Math.sin(angle));
    if(Math.floor(t/100)%3!==2) setPixel(px,py, 0,212,255,153);
  }

  // Spacecraft (simple dot at orbit position)
  const spx=Math.round(385*s), spy=Math.round(205*s);
  fillCircle(spx,spy,Math.round(12*s), 0,212,255);

  // Stars
  [[80,80],[160,50],[420,90],[460,150],[50,200],[110,160],[380,60]].forEach(([sx,sy])=>{
    fillCircle(Math.round(sx*s),Math.round(sy*s),Math.max(1,Math.round(2*s)),255,255,255,200);
  });

  // "A2" text — drawn as simple block letters
  const tx=Math.round(180*s), ty=Math.round(400*s), lh=Math.round(60*s), lw=Math.round(8*s);
  // A
  const aw=Math.round(60*s);
  for(let i=0;i<lh;i++){
    setPixel(tx+Math.round(i*0.4),ty-i,0,212,255);
    setPixel(tx+aw-Math.round(i*0.4),ty-i,0,212,255);
  }
  for(let i=0;i<aw;i++) setPixel(tx+i,ty-Math.round(lh*0.5),0,212,255);
  // 2
  const t2x=Math.round(270*s);
  const t2w=Math.round(60*s);
  for(let i=0;i<t2w;i++) { setPixel(t2x+i,ty-lh,0,212,255); setPixel(t2x+i,ty-Math.round(lh*0.5),0,212,255); setPixel(t2x+i,ty,0,212,255); }
  for(let i=0;i<Math.round(lh*0.5);i++) setPixel(t2x+t2w,ty-lh+i,0,212,255);
  for(let i=0;i<Math.round(lh*0.5);i++) setPixel(t2x,ty-Math.round(lh*0.5)+i,0,212,255);

  // Build PNG raw data (filter byte 0 per row)
  const raw = [];
  for(let y=0;y<H;y++){
    raw.push(0);
    for(let x=0;x<W;x++){
      const i=(y*W+x)*4;
      raw.push(pixels[i],pixels[i+1],pixels[i+2],pixels[i+3]);
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw), {level:6});
  const ihdr=[...u32be(W),...u32be(H),8,2,0,0,0]; // 8-bit but we use RGBA... use color type 6
  const ihdr2=[...u32be(W),...u32be(H),8,6,0,0,0]; // color type 6 = RGBA

  const sig=[137,80,78,71,13,10,26,10];
  const out=[...sig,...chunk('IHDR',ihdr2),...chunk('IDAT',[...compressed]),...chunk('IEND',[])];
  fs.writeFileSync(filePath, Buffer.from(out));
  console.log('Written', filePath, `(${size}x${size})`);
}

writePNG(path.join(__dirname,'public/icon-192.png'),192);
writePNG(path.join(__dirname,'public/icon-512.png'),512);
