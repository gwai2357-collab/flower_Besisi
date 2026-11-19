// 꽃다발 실험 v0(ref/bouquet-v0.html)의 꽃·꽃다발·포장 코드를 그대로 옮긴 것. 나중에 꽃 생성기의 flower-core.js로 교체할 자리.
// 바깥에서는 renderBouquet(data) 하나로만 쓴다 (아래 맨 끝). 손대지 않은 원본 코드라 한국어 주석·이름이 그대로다.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const CW = 0.11, CH = 0.076;   // 꽃다발 속 카드 크기
const V3 = THREE.Vector3;
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const HSL = (h,s,l) => new THREE.Color().setHSL((((h%360)+360)%360)/360, s, Math.min(Math.max(l,0),1));
function hashNoise(x,y,z){ const s=Math.sin(Math.round(x*997)*12.9898 + Math.round(y*997)*78.233 + Math.round(z*997)*37.719)*43758.5453; return s - Math.floor(s); }
function paint(geo, colorFn){
  const p = geo.attributes.position, arr = new Float32Array(p.count*3), v = new V3();
  for (let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); const c=colorFn(v); arr[i*3]=c.r; arr[i*3+1]=c.g; arr[i*3+2]=c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr,3)); return geo;
}

// ---------- 재질 + PS1 꼭짓점 스냅 ----------
const PS1 = { uSnap:{ value:1 }, uRes:{ value:new THREE.Vector2(320,240) } };
function snappable(mat, U = PS1){   // U: { uSnap, uRes } 물체 종류마다 꼭짓점 흔들림 세기를 따로 줄 수 있음
  mat.onBeforeCompile = sh => {
    sh.uniforms.uSnap = U.uSnap; sh.uniforms.uRes = U.uRes;
    sh.vertexShader = 'uniform float uSnap;\nuniform vec2 uRes;\n' + sh.vertexShader.replace('#include <project_vertex>',
      `#include <project_vertex>
      if (uSnap > 0.5) { vec4 sp = gl_Position; sp.xyz /= sp.w;
        sp.xy = floor(sp.xy * uRes * 0.5 + 0.5) / (uRes * 0.5); sp.xyz *= sp.w; gl_Position = sp; }`);
  };
  return mat;
}
const MAT = snappable(new THREE.MeshStandardMaterial({ vertexColors:true, flatShading:true, side:THREE.DoubleSide, roughness:0.85 }));
const PAPER = snappable(new THREE.MeshStandardMaterial({ color:'#f3efe7', flatShading:true, side:THREE.DoubleSide, roughness:0.95 }));
const RIBBON = snappable(new THREE.MeshStandardMaterial({ color:'#9aa98a', flatShading:true, side:THREE.DoubleSide, roughness:0.7 }));
const KRAFT = snappable(new THREE.MeshStandardMaterial({ color:'#b98d5e', flatShading:true, side:THREE.DoubleSide, roughness:0.95 }));
const TWINE = snappable(new THREE.MeshStandardMaterial({ color:'#6e5236', flatShading:true, side:THREE.DoubleSide, roughness:0.9 }));

// ---------- 형태 부품 ----------
function strip({ L, W, nL, profile, curl=0, crease=0.12, serrate=0, wobble=0, ws=0, colorAt }){
  const nW=2, pos=[], col=[], idx=[];
  for (let i=0;i<=nL;i++){
    const t=i/nL; let w=W*profile(t);
    if (serrate && i>0 && i<nL && i%2===1) w *= (1-serrate);
    const yC = (curl + CURL*0.9)*L*t*t;
    for (let j=0;j<=nW;j++){
      const u=j/nW*2-1;
      let y = yC + Math.abs(u)*w*crease;
      if (wobble) y += (hashNoise(i*1.7+ws, j*2.3, ws*0.37)-0.5) * wobble * t*t;
      pos.push(t*L, y, u*w*0.5);
      const c=colorAt(t,u); col.push(c.r,c.g,c.b);
    }
  }
  for (let i=0;i<nL;i++) for (let j=0;j<nW;j++){ const a=i*(nW+1)+j, b=a+1, c=a+nW+1, d=c+1; idx.push(a,c,b, b,c,d); }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col,3));
  g.setIndex(idx); return g;
}
const roundTip = (base,c) => t => t<c ? base+(1-base)*Math.sin(t/c*Math.PI/2) : Math.sqrt(Math.max(0, 1-((t-c)/(1-c))**2));
const pointed  = t => Math.pow(1-t, 0.8) * (t<0.15 ? 0.55+3*t : 1);
const leafy    = t => Math.max(0.12, Math.sin(Math.PI*Math.pow(t,0.75)));

// 원형 잎(유칼립투스): 가장자리가 원점에 붙고 +x로 뻗는 오목한 원판
function disc(R, seg, cup, rng, colorAt){
  const pos=[0,0,0].map((v,i)=> i===0 ? R : 0), col=[], idx=[];
  const c0 = colorAt(0); col.push(c0.r,c0.g,c0.b);
  for (let s=0;s<seg;s++){
    const a=s/seg*Math.PI*2, rr=R*(0.92+rng()*0.12);
    pos.push(R + Math.cos(a)*rr, cup*R, Math.sin(a)*rr);
    const c=colorAt(1); col.push(c.r,c.g,c.b);
  }
  for (let s=0;s<seg;s++) idx.push(0, 1+s, 1+(s+1)%seg);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col,3));
  g.setIndex(idx); return g;
}

function mesh(geo){ return new THREE.Mesh(geo, MAT); }
function tube(curve, radius, radial, colorFn, segs=10){
  return mesh(paint(new THREE.TubeGeometry(curve, segs, radius, radial, false), colorFn));
}
function dome(r, sy, colorFn, bump){
  const g = new THREE.SphereGeometry(r, 10, 5, 0, Math.PI*2, 0, Math.PI/2);
  const p=g.attributes.position, v=new V3();
  for (let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); const n=hashNoise(v.x,v.y,v.z); v.multiplyScalar(1+(n-0.5)*bump); v.y*=sy; p.setXYZ(i,v.x,v.y,v.z); }
  return mesh(paint(g, v => colorFn(hashNoise(v.x*3,v.y*3,v.z*3))));
}
// 피벗(y 회전) + 들림(z 회전)
function place(parent, geo, angle, lift, offset=0, y=0){
  const pv=new THREE.Group(); pv.rotation.y=angle; pv.position.y=y;
  const m=mesh(geo); m.rotation.z=lift; m.position.x=offset; pv.add(m); parent.add(pv); return pv;
}
// 줄기 위 한 점에 부품을 붙이기: 부품의 +x가 dir을 향하고, 부품 평면이 줄기 방향을 품도록
function attach(parent, geo, pos, dir, tan, twist=0){
  const x = dir.clone().normalize();
  let z = tan.clone().addScaledVector(x, -x.dot(tan));
  if (z.lengthSq() < 1e-6) z = new V3(0,0,1); z.normalize();
  const y = new V3().crossVectors(z, x);
  const m = mesh(geo);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));
  m.quaternion.copy(q); m.rotateX(twist); m.position.copy(pos); parent.add(m); return m;
}
function sideVec(tan, angle){
  const ref = Math.abs(tan.y) < 0.9 ? new V3(0,1,0) : new V3(1,0,0);
  const a = new V3().crossVectors(tan, ref).normalize(), b = new V3().crossVectors(tan, a).normalize();
  return a.multiplyScalar(Math.cos(angle)).addScaledVector(b, Math.sin(angle));
}
let FACE_BIAS = 0; const FRONT = new V3(0,0.3,1).normalize(); let FACE_DIR = FRONT;
let SIZE = 1, CURL = 0;   // 송이별 크기 배율, 다발 전체의 말림 정도
function headAt(parent, curve, head){
  head.position.copy(curve.getPoint(1));
  head.quaternion.setFromUnitVectors(new V3(0,1,0), curve.getTangent(1).lerp(FACE_DIR, FACE_BIAS).normalize());
  head.scale.setScalar(SIZE);
  parent.add(head);
}
const greenStem = v => HSL(100, 0.4, 0.3);
function stemLeaves(g, curve, rng, n, L, W){
  for (let i=0;i<n;i++){
    const t = 0.5 + rng()*0.25, p = curve.getPoint(t), tan = curve.getTangent(t);
    const geo = strip({ L:L*(0.85+rng()*0.3), W, nL:5, profile:pointed, curl:-0.35, crease:0.2, colorAt:t2 => HSL(102,0.42,0.28+t2*0.08) });
    attach(g, geo, p, sideVec(tan, rng()*6.28).addScaledVector(tan, 0.9), tan, rng()*0.6);
  }
}

// ---------- 델피늄 공용 부품 ----------
// 꽃 한 송이(작은 꽃): 꽃받침 5장 + 가운데 무늬 + 뒤쪽 꿀주머니(spur). 머리의 +y가 dir을 향함
function floret(g, pos, dir, s, it, rng, sat){
  s *= SIZE;
  const head = new THREE.Group(), L0 = it.lightness/100;
  const base = HSL(it.hue, sat, L0 + (rng()-.5)*0.06), tint = HSL(it.hue+42, sat*0.8, L0+0.03), eye = HSL(it.hue+10, 0.3, 0.88);
  for (let i=0;i<5;i++){
    const geo = strip({ L:0.022*s*(0.9+rng()*0.2), W:0.018*s, nL:3, profile:roundTip(0.35,0.55), curl:-0.1, crease:0.1,
      colorAt:(t,u) => base.clone().lerp(tint, Math.max(0,t-0.5)*1.1).lerp(eye, Math.max(0,(0.2-t)/0.2)*0.5) });
    place(head, geo, i/5*Math.PI*2 + (rng()-.5)*0.3, 0.12 + (rng()-.5)*0.2, 0.002*s);
  }
  const dark = rng() < 0.5;
  const c = mesh(paint(new THREE.IcosahedronGeometry(0.0035*s, 0), () => HSL(it.hue+20, 0.25, dark ? 0.22 : 0.86)));
  c.position.y = 0.002*s; head.add(c);
  const spur = mesh(paint(new THREE.ConeGeometry(0.0038*s, 0.016*s, 4, 1), () => base));
  spur.rotation.x = Math.PI; spur.position.y = -0.008*s; head.add(spur);
  head.position.copy(pos); head.quaternion.setFromUnitVectors(new V3(0,1,0), dir.clone().normalize()); g.add(head);
}
// 봉오리: 길쭉한 연두색 알, 가끔 끝이 파랗게 물듦
function bud(g, pos, dir, s, rng, blueTip, it){
  s *= SIZE;
  const geo = new THREE.SphereGeometry(0.0055*s, 6, 4); geo.scale(1, 1.7, 1);
  paint(geo, v => (blueTip && v.y > 0.003*s) ? HSL(it.hue, 0.45, 0.58) : HSL(72, 0.5, 0.66 + Math.max(0, v.y)/(0.01*s)*0.06));
  const m = mesh(geo); m.position.copy(pos).addScaledVector(dir.clone().normalize(), 0.006*s);
  m.quaternion.setFromUnitVectors(new V3(0,1,0), dir.clone().normalize()); g.add(m);
}
function pedicel(g, a, b){ g.add(tube(new THREE.LineCurve3(a, b), 0.0012, 3, greenStem, 1)); }

// ---------- 종류별 꽃 ----------
const TYPES = {
  lisianthus: { label:'리시안셔스', dot:'#f4f1ea', len:0.38, sat:0.35,
    color: rng => [[90,93],[330,86],[275,82],[90,93]][Math.floor(rng()*4)],
    make(it, rng, curve){
      const g=new THREE.Group(); g.add(tube(curve, 0.005, 5, greenStem));
      const head=new THREE.Group(), base=HSL(it.hue, this.sat, it.lightness/100), throat=HSL(95,0.45,0.6);
      head.add(dome(0.012, 0.8, n => HSL(80,0.4,0.55+n*0.1), 0.2));
      for (let layer=0; layer<2; layer++){
        for (let i=0;i<5;i++){
          const inner = layer===1, L=(inner?0.045:0.056)*(0.92+rng()*0.16);
          const geo = strip({ L, W:inner?0.05:0.06, nL:6, profile:roundTip(0.35,0.45), curl:inner?1.4:1.1, crease:0.1,
            wobble:0.03, ws:rng()*100, colorAt:(t,u) => base.clone().lerp(throat, Math.max(0,(0.3-t)/0.3)*0.7).multiplyScalar(1-0.05*Math.abs(u)) });
          place(head, geo, (i+(inner?0.5:0))/5*Math.PI*2 + (rng()-.5)*0.2, inner?1.0:0.72, 0.004, inner?0.002:0);
        }
      }
      headAt(g, curve, head); stemLeaves(g, curve, rng, 2, 0.09, 0.022); return g;
    } },
  rose: { label:'하늘색 장미', dot:'#9cc8ec', len:0.36, sat:0.72,
    color: rng => [198+rng()*12, 70+rng()*6],
    make(it, rng, curve){
      const g=new THREE.Group(); g.add(tube(curve, 0.0055, 5, greenStem));
      const head=new THREE.Group(), L0=it.lightness/100;
      const base=HSL(it.hue,this.sat,L0), deep=HSL(it.hue+8,this.sat*1.1,L0-0.09), edge=HSL(it.hue-6,this.sat*0.7,Math.min(0.95,L0+0.08));
      // 안쪽은 꽉 오므리고 바깥으로 갈수록 벌어지는 4겹, 꽃잎은 황금각으로 돌아가며 겹침
      const layers=[ {n:3,L:0.03,W:0.04,curl:2.4,lift:1.45,off:0.002}, {n:4,L:0.04,W:0.05,curl:1.9,lift:1.25,off:0.006},
                     {n:5,L:0.05,W:0.06,curl:1.3,lift:1.0,off:0.01}, {n:6,L:0.058,W:0.066,curl:0.7,lift:0.7,off:0.014} ];
      let ang = rng()*6.28;
      layers.forEach((ly, li) => { for (let i=0;i<ly.n;i++){ ang += GA;
        const geo = strip({ L:ly.L*(0.9+rng()*0.2), W:ly.W, nL:5, profile:t => t<0.6 ? 0.45+0.55*Math.sin(t/0.6*Math.PI/2) : 1-0.55*((t-0.6)/0.4)**2, curl:ly.curl, crease:0.03, wobble:0.005, ws:rng()*100,
          colorAt:(t,u) => deep.clone().lerp(base, Math.min(1,t*1.6)).lerp(edge, Math.max(0,t-0.75)*2) });
        place(head, geo, ang, ly.lift+(rng()-.5)*0.1, ly.off, -li*0.003); } });
      for (let i=0;i<5;i++){   // 꽃받침
        const geo=strip({ L:0.03, W:0.008, nL:3, profile:pointed, curl:-0.6, crease:0.2, colorAt:() => HSL(105,0.45,0.3) });
        place(head, geo, i/5*Math.PI*2, -0.5, 0.004, -0.008);
      }
      headAt(g, curve, head);
      for (let i=0;i<2;i++){
        const t=0.5+rng()*0.2, p=curve.getPoint(t), tan=curve.getTangent(t);
        const geo=strip({ L:0.07, W:0.04, nL:8, profile:leafy, serrate:0.25, curl:-0.3, crease:0.15, colorAt:t2 => HSL(112,0.42,0.24+t2*0.08) });
        attach(g, geo, p, sideVec(tan, rng()*6.28).addScaledVector(tan, 0.8), tan, rng()*0.5);
      }
      return g;
    } },
  daisy: { label:'데이지', dot:'#ffffff', len:0.36, sat:0.75,
    color: rng => [48, 95],
    make(it, rng, curve){
      const g=new THREE.Group(); g.add(tube(curve, 0.005, 5, greenStem));
      const head=new THREE.Group(), r0=0.03;
      head.add(dome(r0*1.1, 0.55, n => HSL(44+n*8,0.85,0.42+n*0.12), 0.18));
      const n=20, n1=10;
      for (let i=0;i<n;i++){
        const inner=i>=n1, k=inner?(i-n1)/(n-n1):i/n1;
        const base=HSL(it.hue,this.sat,it.lightness/100+(rng()-.5)*0.06), throat=HSL(it.hue+25,0.55,0.8);
        const geo=strip({ L:0.082*(inner?0.92:1)*(0.9+rng()*0.2), W:0.022, nL:5, profile:roundTip(0.3,0.72), curl:0.1+(rng()-.5)*0.15, crease:0.14,
          colorAt:(t,u) => base.clone().lerp(throat, Math.max(0,(0.22-t)/0.22)*0.6) });
        place(head, geo, (k+(inner?0.5/(n-n1):0))*Math.PI*2+(rng()-.5)*0.12, (inner?0.24:0.12)+(rng()-.5)*0.1, r0*0.55, inner?-0.002:-0.006);
      }
      headAt(g, curve, head); stemLeaves(g, curve, rng, 1, 0.07, 0.016); return g;
    } },
  marigold: { label:'메리골드', dot:'#f0a020', len:0.34, sat:0.92,
    color: rng => [25+rng()*15, 44+rng()*8],
    make(it, rng, curve){
      const g=new THREE.Group(); g.add(tube(curve, 0.005, 5, greenStem));
      const head=new THREE.Group();
      head.add(dome(0.016, 0.8, n => HSL(it.hue-20,0.6,0.16+n*0.1), 0.3));
      for (let i=0;i<5;i++){
        const base=HSL(it.hue,this.sat,it.lightness/100+(rng()-.5)*0.05), blotch=HSL(it.hue-28,0.8,it.lightness/100*0.45);
        const geo=strip({ L:0.08*(0.9+rng()*0.2), W:0.078, nL:6, profile:roundTip(0.3,0.42), curl:0.06+(rng()-.5)*0.12, crease:0.1,
          colorAt:(t,u) => base.clone().lerp(blotch, Math.max(0,(0.55-t)/0.55)*0.95) });
        place(head, geo, i/5*Math.PI*2+(rng()-.5)*0.25, 0.18+(rng()-.5)*0.12, 0.005, (i%2)*0.002);
      }
      headAt(g, curve, head);
      for (let i=0;i<2;i++){
        const t=0.5+rng()*0.2, p=curve.getPoint(t), tan=curve.getTangent(t);
        const geo=strip({ L:0.1, W:0.04, nL:10, profile:leafy, serrate:0.38, curl:-0.3, crease:0.18, colorAt:t2 => HSL(105,0.45,0.25+t2*0.08) });
        attach(g, geo, p, sideVec(tan, rng()*6.28).addScaledVector(tan, 0.8), tan, rng()*0.5);
      }
      return g;
    } },
  delphSpray: { label:'델피늄 가지형', dot:'#3f63d8', len:0.42, sat:0.78,
    color: rng => [218+rng()*14, 50+rng()*8],
    make(it, rng, curve){
      const g=new THREE.Group(); g.add(tube(curve, 0.0035, 5, greenStem)); const s=1.15;
      const tipT = curve.getTangent(1);
      floret(g, curve.getPoint(0.96), sideVec(tipT, rng()*6.28).multiplyScalar(0.6).add(tipT), s, it, rng, this.sat);
      bud(g, curve.getPoint(1), tipT, s, rng, false, it);
      const nb = 3 + Math.floor(rng()*3);
      for (let b=0;b<nb;b++){
        const t0 = 0.5 + b/nb*0.38 + rng()*0.04, p0 = curve.getPoint(t0), tan = curve.getTangent(t0);
        const dir = sideVec(tan, b*2.4 + rng()*0.8).multiplyScalar(0.75).add(tan).normalize(), len = 0.07 + rng()*0.07;
        const p2 = p0.clone().addScaledVector(dir, len).addScaledVector(tan, len*0.4);
        const br = new THREE.CatmullRomCurve3([p0, p0.clone().addScaledVector(dir, len*0.5), p2]);
        g.add(tube(br, 0.0022, 4, greenStem, 4));
        const nf = 2 + Math.floor(rng()*3);
        for (let k=0;k<nf;k++){
          const tt = 0.35 + k/nf*0.6, pp = br.getPoint(tt), bt = br.getTangent(tt);
          const fdir = sideVec(bt, k*Math.PI + rng()).multiplyScalar(0.9).add(bt).normalize();
          const fp = pp.clone().addScaledVector(fdir, 0.012); pedicel(g, pp, fp);
          if (rng() < 0.62) floret(g, fp, fdir.clone().lerp(FRONT, 0.2), s, it, rng, this.sat);
          else bud(g, fp, fdir, s, rng, rng() < 0.4, it);
        }
        bud(g, p2, br.getTangent(1), s, rng, false, it);
      }
      for (let i=0;i<4;i++){   // 가는 바늘 잎
        const t=0.42+rng()*0.25, p=curve.getPoint(t), tan=curve.getTangent(t);
        const geo=strip({ L:0.06+rng()*0.03, W:0.006, nL:3, profile:pointed, curl:-0.2, crease:0.2, colorAt:t2 => HSL(105,0.5,0.32+t2*0.08) });
        attach(g, geo, p, sideVec(tan, rng()*6.28).addScaledVector(tan, 0.8), tan, rng());
      }
      return g;
    } },
  delphSpike: { label:'델피늄 꽃대형', dot:'#6f9be8', len:0.5, sat:0.72,
    color: rng => [205+rng()*25, 52+rng()*12],
    make(it, rng, curve){
      const g=new THREE.Group(); g.add(tube(curve, 0.0045, 5, greenStem, 12));
      const n = 38 + Math.floor(rng()*8), t0 = 0.48;
      for (let i=0;i<n;i++){
        const f = i/(n-1), t = t0 + (1-t0)*f, p = curve.getPoint(t), tan = curve.getTangent(t);
        const radial = sideVec(tan, i*GA + rng()*0.3), taper = 1 - f*0.6;
        const dir = radial.clone().addScaledVector(tan, 0.35).normalize();
        const pos = p.clone().addScaledVector(radial, 0.022*taper);
        if (f > 0.85) bud(g, pos, dir.clone().lerp(tan, 0.5), 0.9*taper+0.3, rng, rng() < 0.7, it);
        else floret(g, pos, dir, 1.35*taper + 0.3, it, rng, this.sat);
      }
      bud(g, curve.getPoint(1), curve.getTangent(1), 0.8, rng, true, it);
      for (let i=0;i<2;i++){   // 아래쪽 갈라진 잎
        const t=0.42+rng()*0.06, p=curve.getPoint(t), tan=curve.getTangent(t);
        const geo=strip({ L:0.08, W:0.035, nL:8, profile:leafy, serrate:0.45, curl:-0.3, crease:0.2, colorAt:t2 => HSL(108,0.45,0.27+t2*0.08) });
        attach(g, geo, p, sideVec(tan, rng()*6.28).addScaledVector(tan, 0.6), tan, rng()*0.5);
      }
      return g;
    } },
  eucalyptus: { label:'유칼립투스', dot:'#8fa89b', len:0.40, sat:0.18,
    color: rng => [150+rng()*15, 50+rng()*7],
    make(it, rng, curve){
      const g=new THREE.Group(); g.add(tube(curve, 0.0035, 4, v => HSL(10,0.3,0.32)));
      let pairAngle = rng()*6.28;
      for (let t=0.46; t<=1.0001; t+=0.075){
        const p=curve.getPoint(Math.min(t,1)), tan=curve.getTangent(Math.min(t,1));
        const R = 0.03 * SIZE * (1.05 - (t-0.46)*0.9) * (0.9+rng()*0.2);
        for (let s=0;s<2;s++){
          const side = sideVec(tan, pairAngle + s*Math.PI);
          const geo = disc(R, 9, 0.18, rng, k => HSL(it.hue, this.sat, it.lightness/100 + k*0.06 + (rng()-.5)*0.03));
          attach(g, geo, p, side.addScaledVector(tan, 0.35), tan, (rng()-.5)*1.2);
        }
        pairAngle += Math.PI/2 + (rng()-.5)*0.4;
      }
      return g;
    } },
  bori: { label:'보리사초', dot:'#9bb06a', len:0.50, sat:0.35,
    color: rng => [80+rng()*12, 40+rng()*8],
    make(it, rng, curve){
      const g=new THREE.Group(); g.add(tube(curve, 0.0022, 4, v => HSL(it.hue, this.sat, it.lightness/100-0.06), 12));
      const spike = () => strip({ L:0.026*SIZE*(0.85+rng()*0.3), W:0.009*SIZE, nL:3, profile:pointed, crease:0.3,
        colorAt:t => HSL(it.hue, this.sat+0.1, it.lightness/100 + t*0.08) });
      // 주 줄기 끝의 이삭
      for (let t=0.7, s=0; t<=1.0001; t+=0.045, s++){
        const p=curve.getPoint(t), tan=curve.getTangent(t);
        attach(g, spike(), p, sideVec(tan, s*Math.PI + rng()*0.4).multiplyScalar(0.45).add(tan), tan, rng());
      }
      // 옆으로 갈라진 가는 가지 2개
      for (let b=0;b<2;b++){
        const t0=0.6+rng()*0.15, p0=curve.getPoint(t0), tan=curve.getTangent(t0);
        const dir=sideVec(tan, rng()*6.28).multiplyScalar(0.7).add(tan).normalize(), len=0.1+rng()*0.06;
        const br=new THREE.CatmullRomCurve3([p0, p0.clone().addScaledVector(dir,len*0.5).add(new V3(0,0.01,0)), p0.clone().addScaledVector(dir,len)]);
        g.add(tube(br, 0.0016, 3, v => HSL(it.hue, this.sat, it.lightness/100-0.06), 4));
        for (let k=0;k<4;k++){
          const t=0.4+k*0.2, p=br.getPoint(Math.min(t,1)), bt=br.getTangent(Math.min(t,1));
          attach(g, spike(), p, sideVec(bt, k*Math.PI).multiplyScalar(0.4).add(bt), bt, rng());
        }
      }
      return g;
    } },
  asclepias: { label:'아스클레피아스', dot:'#c9d39a', len:0.34, sat:0.45,
    color: rng => [68+rng()*10, 68+rng()*8],
    make(it, rng, curve){
      const g=new THREE.Group(); g.add(tube(curve, 0.004, 5, greenStem));
      const umbel = (c, axis, R, n) => {
        R *= SIZE;
        for (let j=0;j<n;j++){
          let v; do { v=new V3(rng()*2-1, rng()*2-1, rng()*2-1); } while (v.lengthSq()>1 || v.dot(axis) < 0.15);
          v.normalize();
          const geo = paint(new THREE.IcosahedronGeometry(0.0062*SIZE*(0.8+rng()*0.4), 0),
            () => HSL(it.hue + (rng()-.5)*10, this.sat, it.lightness/100 + (rng()-.5)*0.08));
          const m = mesh(geo); m.position.copy(c).addScaledVector(v, R*(0.75+rng()*0.25)); g.add(m);
        }
      };
      const tipT = curve.getTangent(1);
      umbel(curve.getPoint(1), tipT, 0.024, 22);
      for (let k=0;k<2;k++){
        const t=0.72+k*0.1, p=curve.getPoint(t), tan=curve.getTangent(t);
        const dir=sideVec(tan, rng()*6.28).multiplyScalar(0.8).add(tan).normalize();
        const end=p.clone().addScaledVector(dir, 0.05);
        g.add(tube(new THREE.LineCurve3(p, end), 0.0025, 4, greenStem, 1));
        umbel(end, dir, 0.017, 13);
      }
      stemLeaves(g, curve, rng, 3, 0.1, 0.026); return g;
    } },
};

TYPES.roseRed = { ...TYPES.rose, label:'빨간 장미', dot:'#c0283a', sat:0.78, color: rng => [350+rng()*8, 40+rng()*6] };

// 꽃다발 속 역할: 앞(메인 꽃) · 중간(필러) · 뒤(소재)
const ROLE = { rose:'front', roseRed:'front', lisianthus:'front', daisy:'front', marigold:'front', asclepias:'middle', delphSpray:'middle', delphSpike:'back', eucalyptus:'back', bori:'back' };
const BAND = { front:[0.0,0.36], middle:[0.3,0.68], back:[0.58,1.0] };   // 깊이 v: 0 = 받는 사람 쪽, 1 = 맨 뒤
const layout = { mode:'facade', variation:0.25, curl:0, sizeVar:0.25, wrap:'paper', mainDepth:0.6, sideGreens:true, avoid:true, bow:0.35 };
const LEGACY = { mainDepth:0, sideGreens:false, avoid:false, bow:0 };   // 이 값들이 없는 예전 선물은 예전 배치 그대로

// 꽃머리 크기(가로 반지름): 종마다 한 번 곧은 줄기로 만들어 재고 기억해 둠
const headRCache = {};
function headRadius(type){
  if (headRCache[type] != null) return headRCache[type];
  const T = TYPES[type], save = [SIZE, CURL, FACE_BIAS];
  SIZE = 1; CURL = 0; FACE_BIAS = 0;
  const [h, l] = T.color(mulberry32(1)), L = T.len;
  const curve = new THREE.CatmullRomCurve3([new V3(0,0,0), new V3(0,L*0.5,0), new V3(0,L,0)]);
  const g = T.make({ type, hue:h, lightness:l, seed:1 }, mulberry32(1), curve); g.updateMatrixWorld(true);
  let r = 0.01; const v = new V3();
  g.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position;
    for (let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld); if (v.y > L - 0.06) r = Math.max(r, Math.hypot(v.x, v.z)); }
    o.geometry.dispose(); });
  [SIZE, CURL, FACE_BIAS] = save;
  return headRCache[type] = r;
}

// ---------- 한 송이를 메시 하나로 합치기 ----------
function bake(group, material){
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert(), geos = [];
  group.traverse(o => {
    if (!o.isMesh) return;
    let g = o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'color') g.deleteAttribute(k);
    if (g.index) g = g.toNonIndexed();
    geos.push(g); o.geometry.dispose();
  });
  const merged = mergeGeometries(geos); geos.forEach(g => g.dispose());
  const m = new THREE.Mesh(merged, material); m.castShadow = true; return m;
}

// ---------- 다발 데이터 ----------
const INITIAL = ['lisianthus','eucalyptus','asclepias','bori','daisy','eucalyptus','lisianthus','bori','asclepias','eucalyptus',
  'marigold','bori','eucalyptus','asclepias','lisianthus','eucalyptus','bori','asclepias','eucalyptus','bori','daisy','eucalyptus'];
let master = 20261107;
const seedRng = () => { master = (master * 1103515245 + 12345) % 2147483648; return master; };
function newItem(type){
  const seed = seedRng(), [hue, lightness] = TYPES[type].color(mulberry32(seed ^ 0x9e37));
  return { type, hue:Math.round(hue), lightness:Math.round(lightness), seed };
}
let items = INITIAL.map(newItem);

// ---------- 다발 배치 ----------
const GA = Math.PI * (3 - Math.sqrt(5));  // 황금각
const TIE = new V3(0, 0.42, 0);
function paperSheet(a0, a1, rBot, rTop, yBot, H0, rng, amp=0.07, mat=PAPER){
  const segA=7, segH=3, pos=[], idx=[];
  for (let h=0;h<=segH;h++){
    const hh=h/segH;
    for (let s=0;s<=segA;s++){
      const a=a0+(a1-a0)*s/segA, H=H0 + amp*(-Math.sin(a));
      let r=rBot+(rTop-rBot)*Math.pow(hh,1.05), y=yBot+hh*H;
      if (h===segH){ r += (rng()-.5)*0.03; y += (rng()-.5)*0.03; }
      pos.push(Math.cos(a)*r, y, Math.sin(a)*r);
    }
  }
  for (let h=0;h<segH;h++) for (let s=0;s<segA;s++){ const a=h*(segA+1)+s, b=a+1, c=a+segA+1, d=c+1; idx.push(a,c,b, b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx);
  const m=new THREE.Mesh(g, mat); m.castShadow=true; return m;
}

let triCount = 0;
function buildBouquet(){
  const group = new THREE.Group(), N = items.length;
  const phiMax = 0.5 + 0.35*Math.min(1, N/45);
  triCount = 0; CURL = layout.curl;
  const grow = Math.min(1, N/45), roleN = {}, roleI = {};
  for (const it of items) roleN[ROLE[it.type]] = (roleN[ROLE[it.type]]||0) + 1;
  const specs = items.map((it, k) => {
    const T = TYPES[it.type], rng = mulberry32(it.seed), role = ROLE[it.type];
    let d, L, face = 0, faceDir = FRONT;
    if (layout.mode === 'facade'){
      // 역할 띠 안에서 해바라기 나선으로 자리 잡기: 먼저 온 꽃이 띠의 가운데
      const i = roleI[role] = (roleI[role]||0), n = roleN[role]; roleI[role]++;
      const r = Math.sqrt((i+0.5)/n), a = i*GA + (rng()-.5)*0.3;
      let u = r*Math.cos(a); const w = r*Math.sin(a);
      let [v0,v1] = BAND[role];
      const mainDepth = layout.mainDepth || 0, sideG = !!layout.sideGreens, bow = layout.bow || 0;
      if (role === 'front') v1 += (0.85 - v1) * mainDepth;            // 메인 꽃도 뒤쪽까지 퍼지며 계단식으로 높아짐
      const toSide = sideG && role === 'back' && i % 2 === 0;        // 소재 절반은 좌우로, 나머지는 뒤에서 높이를 만듦
      if (toSide){ u = ((i>>1) % 2 ? 1 : -1) * (0.5 + 0.35*Math.abs(u)); v0 = 0.3; v1 = 0.9; }
      // 구역 크기: 이 역할에 들어간 송이 수에 비례해 넓어짐 (면적 ∝ 송이 수 → 폭 ∝ √n)
      const N0 = { front:6, middle:5, back:12 }[role], zone = Math.sqrt(Math.max(n, N0)/N0);
      const bandW = (v1-v0) * (role==='front' ? Math.min(1.5, Math.pow(zone, 0.35)) : 1);
      let v = v0 + bandW*(w*0.5+0.5);
      v = Math.min(1, Math.max(0, v + (rng()-.5)*layout.variation*0.9));     // 변주: 역할 띠를 벗어나는 정도
      const spread = (0.45 + 0.4*grow) * (role==='front' ? 0.85 : 1) * Math.min(2.2, Math.pow(zone, 0.85));
      let lean = (0.9 - 1.25*v) * (0.6 + 0.35*grow) * (role==='front' ? Math.min(1.8, Math.pow(zone, 0.45)) : 1);   // 앞은 받는 사람 쪽으로 기울고, 뒤는 곧게
      if (role !== 'back') lean += bow * 0.35 * (1 - u*u);           // 휘어짐: 가운데가 앞으로 나온 볼록한 면
      d = new V3(u*spread, 1, lean).normalize();
      L = T.len * (0.74 + 0.55*v) * (0.92+rng()*0.16);                  // 뒤로 갈수록 계단식으로 높아짐
      face = role==='front' ? 0.35 : 0.1;
      if (bow > 0) faceDir = new V3(u*bow*0.7, 0.3, 1).normalize();   // 볼록한 면을 따라 바깥을 바라봄
    } else {
      const rf = Math.sqrt((k+0.5)/N), a = k*GA + (rng()-.5)*0.3, phi = rf*phiMax + (rng()-.5)*0.08;
      d = new V3(Math.sin(phi)*Math.cos(a), Math.cos(phi), Math.sin(phi)*Math.sin(a));
      L = T.len * (1-0.12*rf) * (0.92+rng()*0.16);
    }
    // 크기 랜덤: 시드에서 따로 뽑아서 다른 무작위 값(꽃잎 각도 등)은 그대로 유지
    const sr = mulberry32(it.seed ^ 0x5bd1e995);
    const size = Math.exp((sr()*2-1) * layout.sizeVar * 0.5);
    L *= Math.pow(size, 0.35);
    if (layout.wrap === 'kraft') L *= 0.62;   // 미니 다발: 꽃이 포장 바로 위에 오도록 줄기를 짧게
    return { it, T, rng, role, d, L, size, face, faceDir };
  });
  // 겹침 피하기: 메인 꽃머리마다 보이지 않는 공을 씌우고, 깊이 파고드는 것만 조금씩 밀어냄
  if (layout.avoid && layout.mode === 'facade'){
    const act = specs.filter(s => s.role === 'front');   // 메인 꽃끼리만
    act.forEach(s => { s.d0 = s.d.clone(); s.r = headRadius(s.it.type) * s.size * 0.8; s.p = TIE.clone().addScaledVector(s.d, s.L); });
    const dv = new V3();
    for (let iter=0; iter<8; iter++){
      for (let a=0; a<act.length; a++) for (let b=a+1; b<act.length; b++){
        const A = act[a], B = act[b], minD = A.r + B.r;
        dv.subVectors(B.p, A.p); const dist = dv.length();
        if (dist >= minD) continue;
        if (dist < 1e-5) dv.set(Math.cos(a+b), 0.1, Math.sin(a+b)); dv.normalize();
        const push = (minD - dist) * 0.5;
        A.p.addScaledVector(dv, -push); B.p.addScaledVector(dv, push);
      }
      for (const s of act){
        const nd = s.p.clone().sub(TIE).normalize();
        const ang = nd.angleTo(s.d0); if (ang > 0.3) nd.lerp(s.d0, 1 - 0.3/ang).normalize();   // 너무 멀리 가지 않게
        s.d = nd; s.p = TIE.clone().addScaledVector(nd, s.L);
      }
    }
  }
  specs.forEach(({ it, T, rng, d, L, size, face, faceDir }) => {
    SIZE = size; FACE_BIAS = face; FACE_DIR = faceDir;
    // 꽃대 말림: +면 바깥으로 휘며 고개를 숙이고, -면 안쪽으로 모임
    const hd = new V3(d.x, 0, d.z);
    if (hd.lengthSq() < 1e-4) hd.set(Math.cos(it.seed), 0, Math.sin(it.seed));
    hd.normalize();
    const tip = TIE.clone().addScaledVector(d, L).addScaledVector(hd, L*0.28*CURL).add(new V3(0, -L*0.18*Math.max(0,CURL)*CURL, 0));
    const bottom = new V3(-d.x*0.04+(rng()-.5)*0.015, TIE.y-0.32, -d.z*0.04+(rng()-.5)*0.015);
    const mid = TIE.clone().addScaledVector(d, L*0.55).addScaledVector(hd, L*0.07*CURL).add(new V3((rng()-.5)*0.03, 0, (rng()-.5)*0.03));
    const curve = new THREE.CatmullRomCurve3([bottom, TIE.clone().addScaledVector(d,0.012), mid, tip]);
    const m = bake(T.make(it, rng, curve), MAT);
    triCount += m.geometry.attributes.position.count/3;
    group.add(m);
  });
  const prng = mulberry32(7);
  let tieY, tieR;
  if (layout.wrap === 'kraft'){
    // 크라프트지 미니 포장: 두 장을 작은 원뿔로 말고 노끈으로 두 번 묶음
    const yBot = TIE.y-0.2, rTop = 0.06 + 0.015*Math.min(1, N/8);
    [[0.6,5.6,0],[3.4,8.6,0.015]].forEach(([a0,a1,dh]) => group.add(paperSheet(a0,a1,0.022,rTop+dh,yBot,0.24+dh,prng,0.05,KRAFT)));
    tieY = TIE.y-0.155; tieR = 0.03;
    for (const dy of [0, 0.008]){
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(tieR+0.0015, tieR+0.0005, 0.0035, 10, 1, true), TWINE);
      tw.position.y = tieY+dy; tw.castShadow = true; group.add(tw);
    }
  } else {
    // 종이 포장지 3장 + 리본
    const rTop = 0.19 + 0.07*Math.min(1, N/45);
    [[0,4.6,0.2],[2.1,6.7,0.24],[4.2,8.8,0.22]].forEach(([a0,a1,h]) => group.add(paperSheet(a0,a1,0.045,rTop,TIE.y-0.27,h+0.18+0.04*Math.min(1,N/45),prng, layout.mode==='facade'?0.13:0.07)));
    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.066,0.028,10,1,true), RIBBON);
    ribbon.position.y = TIE.y-0.235; ribbon.castShadow = true; group.add(ribbon);
    tieY = TIE.y-0.235; tieR = 0.07;
    // 종이 포장: 카드를 포장지 앞쪽 가장자리 위에 꽂아 둠
    const card = makeCard(); card.position.set(0.05, TIE.y+0.03, rTop+0.01); card.rotation.set(-0.28, 0.18, 0.05); group.add(card);
  }
  if (layout.wrap === 'kraft'){
    // 미니 포장: 노끈 앞쪽에 긴 끈으로 매달린 작은 태그
    const tag = makeTag(0.09); tag.position.set(0.01, tieY - 0.003, tieR + 0.004); group.add(tag);
  }
  return group;
}

// ---------- 쪽지 카드 ----------
const NOTE = { text:'여기에 편지를 적어 주세요.\n\n꽃다발의 쪽지를 누르면\n이 글이 열려요.' };
function noteTexture(kraft = false){
  const c=document.createElement('canvas'); c.width=256; c.height=176; const x=c.getContext('2d');
  x.fillStyle = kraft ? '#c9a06e' : '#fbf7ee'; x.fillRect(0,0,256,176);
  x.strokeStyle = kraft ? '#a37a4c' : '#d2c3ae'; x.lineWidth=5; x.strokeRect(12,12,232,152);
  x.fillStyle = kraft ? '#4a3424' : '#6b5a4e'; x.textAlign='center';
  x.font='italic 600 44px Georgia, serif'; x.fillText('for you', 128, 92);
  x.font='22px sans-serif'; x.fillStyle = kraft ? '#6e5238' : '#9b8a7c'; x.fillText('눌러서 열기', 128, 134);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.magFilter=THREE.NearestFilter; return t;
}
const CARD_FACE = snappable(new THREE.MeshStandardMaterial({ map:noteTexture(), roughness:0.9 }));
const CARD_EDGE = snappable(new THREE.MeshStandardMaterial({ color:'#efe6d6', roughness:0.9 }));
let noteMesh = null, tagPivot = null, noteScale0 = 1;
const TW = 0.05, TH = 0.069;   // 매달린 쪽지 크기
function tagTexture(){
  const c=document.createElement('canvas'); c.width=128; c.height=176; const x=c.getContext('2d');
  x.beginPath(); x.moveTo(28,4); x.lineTo(100,4); x.lineTo(124,28); x.lineTo(124,172); x.lineTo(4,172); x.lineTo(4,28); x.closePath();
  x.fillStyle='#c9a06e'; x.fill(); x.strokeStyle='#a37a4c'; x.lineWidth=4; x.stroke();
  x.globalCompositeOperation='destination-out'; x.beginPath(); x.arc(64,26,9,0,Math.PI*2); x.fill();
  x.globalCompositeOperation='source-over'; x.strokeStyle='#ead9bb'; x.lineWidth=4; x.beginPath(); x.arc(64,26,11,0,Math.PI*2); x.stroke();
  x.fillStyle='#4a3424'; x.textAlign='center'; x.font='italic 600 30px Georgia, serif'; x.fillText('for you', 64, 102);
  x.font='15px sans-serif'; x.fillStyle='#6e5238'; x.fillText('눌러서 열기', 64, 134);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.magFilter=THREE.NearestFilter; return t;
}
const TAG_MAT = snappable(new THREE.MeshStandardMaterial({ map:tagTexture(), alphaTest:0.5, side:THREE.DoubleSide, roughness:0.95 }));
function makeTag(len = 0.09){
  const grp = new THREE.Group(), pivot = new THREE.Group(); grp.add(pivot);   // 원점 = 끈에 묶인 지점
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, len, 3), TWINE); str.position.y = -len/2; pivot.add(str);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), TAG_MAT);
  tag.position.y = -len - TH*0.35; tag.rotation.y = 0.15; tag.castShadow = true; pivot.add(tag);
  pivot.rotation.x = -0.12;
  noteMesh = tag; tagPivot = pivot; noteScale0 = TW/CW; return grp;
}
function makeCard(){
  const grp = new THREE.Group();
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.076, 0.002), [CARD_EDGE,CARD_EDGE,CARD_EDGE,CARD_EDGE,CARD_FACE,CARD_EDGE]);
  card.position.y = 0.05; card.castShadow = true; grp.add(card);
  const pick = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.12, 4), RIBBON);
  pick.position.set(0, -0.005, -0.035); pick.rotation.x = 0.75; grp.add(pick);
  noteMesh = card; tagPivot = null; noteScale0 = 1; return grp;
}



// ================= 바깥으로 내보내는 부분 =================
export { TYPES, ROLE, PS1, snappable, MAT, RIBBON, TWINE, KRAFT, PAPER, mulberry32, HSL, TW, TH };
export const rollItem = newItem;   // (종류) → { type, hue, lightness, seed }
// data: { items:[{type,hue,lightness,seed}], wrap:'paper'|'kraft', layout?:{...} }
// 반환: THREE.Group. userData: { noteMesh(눌러서 열 카드·태그), tagPivot, tris }
export function renderBouquet(data){
  items = (data.items || []).map(it => ({ ...it }));
  Object.assign(layout, { mode:'facade', variation:0.25, curl:0, sizeVar:0.25, wrap:'paper', mainDepth:0.6, sideGreens:true, avoid:true, bow:0.35 }, data.layout || {});
  if (data.wrap) layout.wrap = data.wrap;
  const g = buildBouquet();
  g.userData = { noteMesh, tagPivot, tris:triCount };
  return g;
}
