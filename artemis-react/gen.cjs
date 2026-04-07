const fs = require('fs'), zlib = require('zlib'), path = require('path');
const OUT = path.join(__dirname, 'public');
function writePNG(name, size) {
  const W=size,H=size;
  function u32be(n){return[(n>>>24)&0xff,(n>>>16)&0xff,(n>>>8)&0xff,n&0xff];}
  function crc32(buf){let c=0xffffffff;const t=new Uint32Array(256);for(let i=0;i<256;i++){let x=i;for(let j=0;j<8;j++)x=x&1?(0xedb88320^(x>>>1)):(x>>>1);t[i]=x;}for(const b of buf)c=t[(c^b)&0xff]^(c>>>8);return(c^0xffffffff)>>>0;}
  function chunk(type,data){const tb=[...type].map(c=>c.charCodeAt(0));return[...u32be(data.length),...tb,...data,...u32be(crc32([...tb,...data]))];}
  const px=new Uint8Array(W*H*4);
  function sp(x,y,r,g,b,a=255){if(x<0||x>=W||y<0||y>=H)return;const i=(y*W+x)*4;px[i]=r;px[i+1]=g;px[i+2]=b;px[i+3]=a;}
  function fc(cx,cy,r,rr,g,b,a=255){for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++)if((x-cx)**2+(y-cy)**2<=r**2)sp(x,y,rr,g,b,a);}
  const s=size/512;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)sp(x,y,11,13,24);
  const rad=Math.round(80*s);
  for(let y=0;y<rad;y++)for(let x=0;x<rad;x++){const d=Math.sqrt((rad-x)**2+(rad-y)**2);if(d>rad){sp(x,y,0,0,0,0);sp(W-1-x,y,0,0,0,0);sp(x,H-1-y,0,0,0,0);sp(W-1-x,H-1-y,0,0,0,0);}}
  fc(Math.round(256*s),Math.round(310*s),Math.round(80*s),26,58,107);
  const ocx=Math.round(256*s),ocy=Math.round(290*s),orx=Math.round(160*s),ory=Math.round(90*s);
  for(let t=0;t<6284;t++){const a=t/1000;if(Math.floor(t/100)%3!==2)sp(Math.round(ocx+orx*Math.cos(a)),Math.round(ocy+ory*Math.sin(a)),0,212,255,153);}
  fc(Math.round(385*s),Math.round(205*s),Math.round(12*s),0,212,255);
  [[80,80],[160,50],[420,90],[460,150],[50,200]].forEach(([sx,sy])=>fc(Math.round(sx*s),Math.round(sy*s),Math.max(1,Math.round(2*s)),255,255,255,200));
  const raw=[];for(let y=0;y<H;y++){raw.push(0);for(let x=0;x<W;x++){const i=(y*W+x)*4;raw.push(px[i],px[i+1],px[i+2],px[i+3]);}}
  const comp=zlib.deflateSync(Buffer.from(raw),{level:6});
  const sig=[137,80,78,71,13,10,26,10];
  const fp=path.join(OUT,name);
  fs.writeFileSync(fp,Buffer.from([...sig,...chunk('IHDR',[...u32be(W),...u32be(H),8,6,0,0,0]),...chunk('IDAT',[...comp]),...chunk('IEND',[])]));
  console.log('Written',fp);
}
writePNG('icon-192.png',192);
writePNG('icon-512.png',512);
