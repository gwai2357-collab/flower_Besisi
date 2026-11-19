// 선물 오브젝트 25종: 꽃망울 · 선물 오브젝트 v11(ref/gift-objects-v11.html)의 템플릿 코드를 tools/gen_gifts.py로 옮긴 것.
// 바깥에서는 makeGiftObject(id) 만 쓴다. 흔들림 세기는 물체 종류 'gift'(820)를 따른다.
import * as THREE from 'three';
import { snappable } from './bouquet-v0.js';
import { SNAP } from './stage.js';

const cache = new Map();
function M(color){
  const hex = new THREE.Color(color).getHexString();
  if (!cache.has(hex)) cache.set(hex, snappable(new THREE.MeshStandardMaterial({ color: '#' + hex, flatShading: true, roughness: 0.85 }), SNAP.gift));
  return cache.get(hex);
}
function clearM(color, op){
  return snappable(new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.3, transparent: true, opacity: op, depthWrite: false }), SNAP.gift);
}
function mesh(geo, mat, pos=[0,0,0], rot=[0,0,0], scl){
  const m = new THREE.Mesh(geo, typeof mat === 'string' ? M(mat) : mat);
  m.position.set(...pos); m.rotation.set(...rot);
  if (scl) m.scale.set(...scl);
  return m;
}
const Cyl = (rt, rb, h, s=10) => new THREE.CylinderGeometry(rt, rb, h, s);
const Sph = (r, w=8, h=6) => new THREE.SphereGeometry(r, w, h);
const Box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
function wedge(len, half, h){
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(len, -half); s.lineTo(len, half); s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth:h, bevelEnabled:false });
  g.rotateX(-Math.PI/2);
  g.translate(-len*0.55, 0, 0);
  return g;
}
function berry(x, y, z){
  const g = new THREE.Group();
  g.add(mesh(new THREE.ConeGeometry(0.075, 0.16, 6), '#D9334A', [0, 0, 0], [Math.PI, 0, 0]));
  g.add(mesh(new THREE.ConeGeometry(0.06, 0.04, 5), '#5E9C5A', [0, 0.09, 0]));
  g.position.set(x, y + 0.08, z);
  return g;
}

const TEMPLATES = [
  { id:'coffee', name:'커피', cat:'카페', main:['#FBF6EC','#3A3640','#C99A6B','#9CC3E8'], acc:['#C99A6B','#5E9C5A','#E8577A','#2B1E33'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Cyl(0.33, 0.25, 0.9), p.main, [0, 0.45, 0]));
      g.add(mesh(Cyl(0.338, 0.29, 0.34), p.acc, [0, 0.45, 0]));
      g.add(mesh(Cyl(0.36, 0.36, 0.06), '#F3EFE7', [0, 0.92, 0]));
      g.add(mesh(Cyl(0.27, 0.33, 0.08), '#F3EFE7', [0, 0.99, 0]));
      g.add(mesh(Box(0.1, 0.03, 0.05), '#2B1E33', [0, 1.04, 0.2]));
      const steam = new THREE.Group();
      for (let i = 0; i < 3; i++) steam.add(mesh(Box(0.05, 0.05, 0.05), clearM('#ffffff', 0.55), [Math.sin(i*2.1)*0.06, 1.15 + i*0.12, 0.15]));
      steam.userData.steam = true; g.add(steam);
      return g;
    } },
  { id:'iced', name:'아이스 음료', cat:'카페', main:['#6B4426','#8FB35A','#F2A5B6','#F08A3C'], acc:['#2E8B57','#E8577A','#2B1E33','#FBF6EC'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Cyl(0.27, 0.215, 0.74), p.main, [0, 0.39, 0]));
      g.add(mesh(Cyl(0.27, 0.27, 0.08), '#FBF6EC', [0, 0.8, 0]));
      for (let i = 0; i < 4; i++) g.add(mesh(Box(0.12, 0.12, 0.12), clearM('#E6F4FF', 0.8), [Math.cos(i*1.7)*0.12, 0.62 + (i%2)*0.1, Math.sin(i*1.7)*0.12], [i, i*0.7, 0]));
      g.add(mesh(Cyl(0.03, 0.03, 1.0, 6), p.acc, [0.08, 1.0, 0.02], [0, 0, -0.18]));
      g.add(mesh(Cyl(0.32, 0.24, 1.0), clearM('#DDEEFF', 0.35), [0, 0.5, 0]));
      g.add(mesh(new THREE.SphereGeometry(0.32, 10, 4, 0, Math.PI*2, 0, Math.PI/2), clearM('#DDEEFF', 0.35), [0, 1.0, 0]));
      return g;
    } },
  { id:'slice', name:'조각 케이크', cat:'디저트', main:['#FBF6EC','#7A4A2E','#F7C6D0','#B9E0A5'], acc:['#D9334A','#F2C14E','#2B1E33','#9B7BD1'],
    build(p){
      const g = new THREE.Group();
      const sponge = '#EBC88A';
      g.add(mesh(wedge(0.95, 0.36, 0.2), sponge, [0, 0, 0]));
      g.add(mesh(wedge(0.95, 0.36, 0.06), p.main, [0, 0.2, 0]));
      g.add(mesh(wedge(0.95, 0.36, 0.2), sponge, [0, 0.26, 0]));
      g.add(mesh(wedge(0.95, 0.36, 0.1), p.main, [0, 0.46, 0]));
      g.add(mesh(Box(0.04, 0.03, 0.04), p.acc, [-0.05, 0.585, 0.08]));
      g.add(mesh(Box(0.04, 0.03, 0.04), p.acc, [0.1, 0.585, -0.1]));
      g.add(berry(0.25, 0.56, 0));
      g.add(mesh(Sph(0.06, 6, 4), p.main, [0.38, 0.58, 0.12]));
      g.add(mesh(Sph(0.06, 6, 4), p.main, [0.38, 0.58, -0.12]));
      g.rotation.y = -0.5;
      return g;
    } },
  { id:'cake', name:'홀케이크', cat:'디저트', main:['#FBF6EC','#7A4A2E','#F7C6D0','#F2D29B'], acc:['#E8577A','#9CC3E8','#F2C14E','#FBF6EC'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Cyl(0.72, 0.72, 0.04, 14), '#F3EFE7', [0, 0.02, 0]));
      g.add(mesh(Cyl(0.55, 0.55, 0.44, 12), p.main, [0, 0.26, 0]));
      g.add(mesh(Cyl(0.56, 0.56, 0.06, 12), '#FFFDF7', [0, 0.5, 0]));
      for (let i = 0; i < 10; i++){
        const a = i / 10 * Math.PI * 2;
        g.add(mesh(Sph(0.07, 6, 4), '#FFFDF7', [Math.cos(a)*0.45, 0.56, Math.sin(a)*0.45]));
        g.add(mesh(Sph(0.05, 5, 3), p.acc, [Math.cos(a)*0.56, 0.16, Math.sin(a)*0.56]));
      }
      for (let i = 0; i < 4; i++){ const a = i/4*Math.PI*2 + 0.4; g.add(berry(Math.cos(a)*0.25, 0.53, Math.sin(a)*0.25)); }
      g.add(mesh(Cyl(0.03, 0.03, 0.3, 6), p.acc, [0, 0.68, 0]));
      const fl = mesh(new THREE.ConeGeometry(0.05, 0.12, 5), '#F2C14E', [0, 0.89, 0]);
      fl.userData.flame = true; g.add(fl);
      return g;
    } },
  { id:'chicken', name:'치킨', cat:'식사', main:['#D9334A','#C99A6B','#2B1E33','#F2C14E'], acc:['#FBF6EC','#F2C14E','#2B1E33','#D9334A'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Box(0.95, 0.46, 0.72), p.main, [0, 0.23, 0]));
      g.add(mesh(Box(0.97, 0.1, 0.74), p.acc, [0, 0.28, 0]));
      g.add(mesh(Box(0.88, 0.02, 0.65), '#5A3A22', [0, 0.46, 0]));
      const hinge = new THREE.Group(); hinge.position.set(0, 0.46, -0.36); hinge.rotation.x = -1.15;
      hinge.add(mesh(Box(0.95, 0.04, 0.72), p.main, [0, 0, 0.36]));
      hinge.add(mesh(Box(0.4, 0.045, 0.2), p.acc, [0, 0.005, 0.4]));
      g.add(hinge);
      const legs = [[-0.22, 0.12, 0.5, 0.25], [0.05, -0.05, 0.75, -0.1], [0.27, 0.1, 0.55, -0.35]];
      for (const [x, z, h, rz] of legs){
        const d = new THREE.Group();
        d.add(mesh(Sph(0.17, 7, 5), '#C77B30', [0, 0, 0], [0, 0, 0], [1, 1.35, 1]));
        d.add(mesh(Cyl(0.035, 0.035, 0.22, 6), '#FFFDF7', [0, 0.3, 0]));
        d.add(mesh(Sph(0.05, 5, 3), '#FFFDF7', [0.03, 0.42, 0]));
        d.add(mesh(Sph(0.05, 5, 3), '#FFFDF7', [-0.03, 0.42, 0]));
        d.position.set(x, h*0.75, z); d.rotation.z = rz;
        g.add(d);
      }
      return g;
    } },
  { id:'icecream', name:'아이스크림', cat:'디저트', main:['#F7C6D0','#7A4A2E','#B9E0A5','#FBF6EC'], acc:['#FBF6EC','#F2C14E','#9CC3E8','#F7C6D0'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(new THREE.ConeGeometry(0.22, 0.7, 8), '#D9A35B', [0, 0.35, 0], [Math.PI, 0, 0]));
      g.add(mesh(Cyl(0.24, 0.23, 0.06, 8), '#C88D45', [0, 0.71, 0]));
      g.add(mesh(Sph(0.25), p.main, [0, 0.86, 0]));
      g.add(mesh(Sph(0.22), p.acc, [0.02, 1.16, 0]));
      const cols = ['#E8577A', '#F2C14E', '#5E9C5A', '#9CC3E8', '#9B7BD1'];
      for (let i = 0; i < 9; i++){
        const a = i * 2.4, b = 0.4 + (i%3)*0.35;
        g.add(mesh(Box(0.025, 0.06, 0.025), cols[i%5], [0.02 + Math.cos(a)*Math.sin(b)*0.22, 1.16 + Math.cos(b)*0.22, Math.sin(a)*Math.sin(b)*0.22], [a, b, 0]));
      }
      g.add(mesh(Sph(0.06, 6, 4), '#D9334A', [0.02, 1.42, 0]));
      g.add(mesh(Cyl(0.008, 0.008, 0.12, 4), '#5E9C5A', [0.05, 1.5, 0], [0, 0, -0.5]));
      return g;
    } },
  { id:'lipstick', name:'립스틱', cat:'뷰티', main:['#C2185B','#E8577A','#A8283F','#F08A6E'], acc:['#D4AF37','#2B1E33','#C0C0C8','#FBF6EC'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Cyl(0.17, 0.17, 0.45), p.acc, [0, 0.225, 0]));
      g.add(mesh(Cyl(0.176, 0.176, 0.04), '#D4AF37', [0, 0.47, 0]));
      g.add(mesh(Cyl(0.13, 0.13, 0.22), '#D4AF37', [0, 0.6, 0]));
      const bg = Cyl(0.11, 0.11, 0.3);
      const pos = bg.attributes.position;
      for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0) pos.setY(i, 0.15 - 0.5 * (pos.getX(i) + 0.11));
      bg.computeVertexNormals();
      g.add(mesh(bg, p.main, [0, 0.86, 0]));
      g.add(mesh(Cyl(0.17, 0.17, 0.5), p.acc, [0.45, 0.17, 0.1], [0, 0.4, Math.PI/2]));
      return g;
    } },
  { id:'voucher', name:'상품권', cat:'그 밖에', main:['#FBF6EC','#E8577A','#9CC3E8','#2B1E33'], acc:['#B83A5E','#F2C14E','#5E9C5A','#D4AF37'],
    build(p){
      const g = new THREE.Group();
      const card = mesh(Box(0.88, 0.5, 0.02), '#FFFDF7', [0, 0.82, 0.01], [0, 0, 0.05]);
      g.add(card);
      g.add(mesh(Box(0.88, 0.08, 0.025), p.acc, [0, 0.95, 0.012], [0, 0, 0.05]));
      g.add(mesh(Box(1.0, 0.64, 0.05), p.main, [0, 0.32, 0]));
      const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, -0.34); s.lineTo(-0.5, 0);
      const fg = new THREE.ExtrudeGeometry(s, { depth:0.02, bevelEnabled:false });
      g.add(mesh(fg, p.main, [0, 0.64, 0.03]));
      const heart = new THREE.Group();
      heart.add(mesh(Sph(0.055, 6, 4), p.acc, [-0.04, 0.03, 0]));
      heart.add(mesh(Sph(0.055, 6, 4), p.acc, [0.04, 0.03, 0]));
      heart.add(mesh(new THREE.ConeGeometry(0.075, 0.12, 6), p.acc, [0, -0.04, 0], [Math.PI, 0, 0]));
      heart.position.set(0, 0.32, 0.07); g.add(heart);
      g.rotation.x = -0.12;
      return g;
    } },
  { id:'tumbler', name:'텀블러', cat:'생활', main:['#9CC3E8','#FBF6EC','#3A3640','#B9C7A5'], acc:['#FBF6EC','#2B1E33','#E8577A','#C0C0C8'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Cyl(0.26, 0.23, 1.0, 12), p.main, [0, 0.5, 0]));
      g.add(mesh(Cyl(0.262, 0.255, 0.07, 12), p.acc, [0, 0.72, 0]));
      g.add(mesh(Cyl(0.27, 0.27, 0.14, 12), p.acc, [0, 1.07, 0]));
      g.add(mesh(Cyl(0.2, 0.27, 0.05, 12), p.acc, [0, 1.165, 0]));
      g.add(mesh(new THREE.TorusGeometry(0.1, 0.028, 4, 8, Math.PI), p.acc, [0, 1.18, 0]));
      return g;
    } },
  { id:'perfume', name:'향수', cat:'뷰티', main:['#F2A5B6','#F2C14E','#9CC3E8','#B9E0A5'], acc:['#D4AF37','#2B1E33','#FBF6EC','#C0C0C8'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Box(0.42, 0.38, 0.22), p.main, [0, 0.24, 0]));
      g.add(mesh(Box(0.52, 0.56, 0.3), clearM('#EAF4FF', 0.4), [0, 0.28, 0]));
      g.add(mesh(Box(0.24, 0.12, 0.01), '#FFFDF7', [0, 0.3, 0.152]));
      g.add(mesh(Cyl(0.06, 0.06, 0.08, 8), '#D4AF37', [0, 0.6, 0]));
      g.add(mesh(Box(0.22, 0.24, 0.22), p.acc, [0, 0.76, 0]));
      g.rotation.y = 0.4; g.scale.setScalar(1.35);
      return g;
    } },
  { id:'gloss', name:'립글로우', cat:'뷰티', main:['#F28CA0','#E8577A','#F7B9A0','#C2185B'], acc:['#FBF6EC','#2B1E33','#D4AF37','#F2A5B6'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Cyl(0.075, 0.075, 0.5, 8), p.main, [0, 0.27, 0]));
      g.add(mesh(Cyl(0.1, 0.1, 0.56, 8), clearM('#FFFFFF', 0.4), [0, 0.28, 0]));
      g.add(mesh(Cyl(0.105, 0.105, 0.42, 8), p.acc, [0, 0.77, 0]));
      const lay = new THREE.Group();
      lay.add(mesh(Cyl(0.09, 0.09, 0.32, 8), p.acc, [0, 0, 0]));
      lay.add(mesh(Cyl(0.075, 0.09, 0.08, 8), p.main, [0, 0.2, 0]));
      lay.position.set(0.32, 0.09, 0.12); lay.rotation.set(0, 0.5, Math.PI/2);
      g.add(lay); g.scale.setScalar(1.3);
      return g;
    } },
  { id:'delivery', name:'배달 봉투', cat:'식사', main:['#FBF6EC','#C99A6B','#B9E0A5','#9CC3E8'], acc:['#2E8B57','#D9334A','#2B1E33','#F2C14E'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Box(0.82, 0.62, 0.5), p.main, [0, 0.31, 0]));
      g.add(mesh(Box(0.4, 0.22, 0.01), p.acc, [0, 0.33, 0.256]));
      g.add(mesh(Box(0.7, 0.16, 0.42), '#3A3640', [0, 0.66, 0]));
      g.add(mesh(Box(0.72, 0.04, 0.44), '#D9334A', [0, 0.75, 0]));
      g.add(mesh(Box(0.025, 0.5, 0.025), '#D9B27A', [0.22, 0.85, 0.05], [0.15, 0, -0.12]));
      g.add(mesh(Box(0.025, 0.5, 0.025), '#D9B27A', [0.26, 0.85, 0.08], [0.15, 0, -0.08]));
      g.add(mesh(new THREE.TorusGeometry(0.14, 0.035, 4, 8, Math.PI), p.main, [-0.2, 0.78, 0], [0, Math.PI/2, 0]));
      g.add(mesh(new THREE.TorusGeometry(0.14, 0.035, 4, 8, Math.PI), p.main, [-0.1, 0.78, 0], [0, Math.PI/2, 0.3]));
      return g;
    } },
  { id:'shopping', name:'쇼핑백', cat:'쇼핑', main:['#C99A6B','#FBF6EC','#3A3640','#5E9C5A'], acc:['#2B1E33','#E8577A','#FBF6EC','#D4AF37'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Box(0.75, 0.82, 0.36), p.main, [0, 0.41, 0]));
      g.add(mesh(Box(0.76, 0.07, 0.37), p.acc, [0, 0.76, 0]));
      g.add(mesh(Box(0.3, 0.3, 0.01), p.acc, [0, 0.42, 0.182]));
      g.add(mesh(new THREE.TorusGeometry(0.15, 0.016, 4, 10, Math.PI), p.acc, [0, 0.82, 0.12]));
      g.add(mesh(new THREE.TorusGeometry(0.15, 0.016, 4, 10, Math.PI), p.acc, [0, 0.82, -0.12]));
      g.add(mesh(Box(0.36, 0.24, 0.01), '#F7C6D0', [-0.12, 0.9, 0], [0, 0.3, 0.35]));
      g.add(mesh(Box(0.32, 0.22, 0.01), '#FFFDF7', [0.12, 0.9, 0.02], [0, -0.4, -0.3]));
      return g;
    } },
  { id:'sticks', name:'막대 과자', cat:'간식', main:['#D9334A','#F2C14E','#9CC3E8','#2B1E33'], acc:['#5A3A22','#F7C6D0','#FBF6EC','#8FB35A'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Box(0.56, 0.9, 0.16), p.main, [0, 0.45, 0]));
      g.add(mesh(Box(0.565, 0.22, 0.165), '#FFFDF7', [0, 0.3, 0]));
      g.add(mesh(Box(0.56, 0.16, 0.01), p.main, [0, 0.97, -0.09], [-0.5, 0, 0]));
      for (let i = 0; i < 6; i++){
        const s = new THREE.Group();
        s.add(mesh(Cyl(0.022, 0.022, 0.2, 5), '#E6C38A', [0, 0.1, 0]));
        s.add(mesh(Cyl(0.03, 0.03, 0.42, 5), p.acc, [0, 0.41, 0]));
        s.position.set(-0.2 + i * 0.08, 0.72 + (i%3) * 0.05, (i%2) * 0.04 - 0.02);
        s.rotation.z = (i - 2.5) * 0.06;
        g.add(s);
      }
      g.rotation.y = -0.3;
      return g;
    } },
  { id:'beauty', name:'뷰티 카드', cat:'그 밖에', main:['#F7C6D0','#2B1E33','#FBF6EC','#9B7BD1'], acc:['#D4AF37','#E8577A','#C0C0C8','#FBF6EC'],
    build(p){
      const g = new THREE.Group();
      const card = new THREE.Group();
      card.add(mesh(Box(0.95, 0.6, 0.03), p.main, [0, 0, 0]));
      card.add(mesh(Box(0.08, 0.61, 0.035), p.acc, [0.22, 0, 0]));
      card.add(mesh(Box(0.96, 0.08, 0.035), p.acc, [0, 0.1, 0]));
      card.add(mesh(Sph(0.06, 6, 4), p.acc, [0.16, 0.16, 0.03], [0, 0, 0.5], [1.4, 0.8, 0.6]));
      card.add(mesh(Sph(0.06, 6, 4), p.acc, [0.28, 0.16, 0.03], [0, 0, -0.5], [1.4, 0.8, 0.6]));
      card.add(mesh(Box(0.14, 0.1, 0.01), '#D4AF37', [-0.3, -0.12, 0.02]));
      card.add(mesh(new THREE.OctahedronGeometry(0.04), '#FFFDF7', [-0.28, 0.17, 0.03]));
      card.add(mesh(new THREE.OctahedronGeometry(0.03), '#FFFDF7', [-0.18, 0.21, 0.03]));
      card.position.set(0, 0.36, 0); card.rotation.x = -0.12;
      g.add(card);
      g.add(mesh(Box(0.5, 0.08, 0.22), '#FFFDF7', [0, 0.04, 0.02]));
      return g;
    } },
  { id:'macaron', name:'마카롱', cat:'디저트', main:['#F7B9C8','#B9E0A5','#C8A2E8','#F2D29B'], acc:['#FFFDF7','#7A4A2E','#F2C14E','#F7B9C8'],
    build(p){
      const g = new THREE.Group();
      const mac = (c, x, y, z, rx, rz) => {
        const m = new THREE.Group();
        m.add(mesh(Cyl(0.3, 0.26, 0.1, 12), c, [0, 0.05, 0]));
        m.add(mesh(Cyl(0.31, 0.31, 0.035, 12), c, [0, 0.115, 0]));
        m.add(mesh(Cyl(0.27, 0.27, 0.07, 12), p.acc, [0, 0.165, 0]));
        m.add(mesh(Cyl(0.31, 0.31, 0.035, 12), c, [0, 0.215, 0]));
        m.add(mesh(new THREE.SphereGeometry(0.3, 12, 4, 0, Math.PI*2, 0, Math.PI/2), c, [0, 0.23, 0], [0, 0, 0], [1, 0.4, 1]));
        m.position.set(x, y, z); m.rotation.set(rx, 0, rz);
        g.add(m);
      };
      mac(p.main, -0.16, 0, 0.05, 0, 0);
      mac('#FFF3C4', -0.14, 0.36, 0.02, 0.05, 0.08);
      mac(p.main === '#B9E0A5' ? '#F7B9C8' : '#B9E0A5', 0.38, 0.3, -0.05, 0, -1.35);
      return g;
    } },
  { id:'cookie', name:'쿠키', cat:'간식', main:['#9CC3E8','#D9334A','#5E9C5A','#F2C14E'], acc:['#FBF6EC','#F2C14E','#2B1E33','#D9334A'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Cyl(0.6, 0.6, 0.22, 14), p.main, [0, 0.11, 0]));
      g.add(mesh(Cyl(0.61, 0.61, 0.05, 14), p.acc, [0, 0.13, 0]));
      g.add(mesh(Cyl(0.54, 0.54, 0.01, 14), '#FFFDF7', [0, 0.225, 0]));
      const ck = (x, y, z, rx, rz, c) => {
        const m = new THREE.Group();
        m.add(mesh(Cyl(0.16, 0.16, 0.05, 10), c, [0, 0, 0]));
        for (let i = 0; i < 4; i++) m.add(mesh(Box(0.04, 0.03, 0.04), '#4A2E1E', [Math.cos(i*1.9)*0.09, 0.03, Math.sin(i*1.9)*0.09]));
        m.position.set(x, y, z); m.rotation.set(rx, 0, rz); g.add(m);
      };
      ck(-0.25, 0.26, 0.15, 0, 0, '#D9A35B');
      ck(0.2, 0.26, 0.2, 0, 0, '#E6C38A');
      ck(0.05, 0.31, -0.12, 0.1, 0.05, '#C88D45');
      ck(-0.1, 0.45, -0.25, -1.1, 0.2, '#D9A35B');
      ck(0.25, 0.43, -0.2, -1.2, -0.3, '#E6C38A');
      const lid = mesh(Cyl(0.62, 0.62, 0.08, 14), p.main, [0, 0.62, -0.6], [-1.25, 0, 0]);
      g.add(lid);
      return g;
    } },
  { id:'choco', name:'초콜릿', cat:'간식', main:['#D9334A','#2E3A6B','#F2C14E','#5E9C5A'], acc:['#E8577A','#F2C14E','#FBF6EC','#7A4A2E'],
    build(p){
      const g = new THREE.Group();
      const bar = new THREE.Group();
      bar.add(mesh(Box(0.5, 0.9, 0.07), '#5A3A22', [0, 0, 0]));
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) bar.add(mesh(Box(0.2, 0.18, 0.04), '#6B4426', [-0.11 + i*0.22, 0.32 - j*0.2, 0.05]));
      bar.add(mesh(Box(0.52, 0.5, 0.1), p.main, [0, -0.2, 0]));
      bar.add(mesh(Box(0.53, 0.04, 0.11), '#C0C0C8', [0, 0.06, 0]));
      bar.add(mesh(Box(0.3, 0.12, 0.005), '#FFFDF7', [0, -0.2, 0.052]));
      bar.position.set(-0.1, 0.46, 0); bar.rotation.set(-0.12, 0.25, 0.05);
      g.add(bar);
      for (let i = 0; i < 3; i++){
        const t = new THREE.Group();
        t.add(mesh(Cyl(0.11, 0.08, 0.06, 8), p.acc, [0, 0.03, 0]));
        t.add(mesh(Sph(0.09, 7, 5), i === 1 ? '#F3E2C4' : '#4A2E1E', [0, 0.1, 0]));
        t.position.set(0.3 + (i%2)*0.12, 0, 0.25 - i*0.22);
        g.add(t);
      }
      return g;
    } },
  { id:'handcream', name:'핸드크림', cat:'뷰티', main:['#FBF6EC','#F7C6D0','#B9C7A5','#9CC3E8'], acc:['#B83A5E','#5E9C5A','#D4AF37','#2B1E33'],
    build(p){
      const g = new THREE.Group();
      const tube = (c, cap) => {
        const t = new THREE.Group();
        const geo = Cyl(0.13, 0.13, 0.55, 10);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++){
          const k = Math.max(0, (pos.getY(i) + 0.1) / 0.375);
          pos.setX(i, pos.getX(i) * (1 + 0.45*k)); pos.setZ(i, pos.getZ(i) * (1 - 0.85*k));
        }
        geo.computeVertexNormals();
        t.add(mesh(geo, c, [0, 0.39, 0]));
        t.add(mesh(Box(0.4, 0.05, 0.04), c, [0, 0.68, 0]));
        t.add(mesh(Cyl(0.1, 0.1, 0.12, 10), cap, [0, 0.06, 0]));
        t.add(mesh(Box(0.18, 0.14, 0.01), cap, [0, 0.38, 0.115]));
        return t;
      };
      const a = tube(p.main, p.acc); a.position.set(-0.12, 0, 0); g.add(a);
      const b = tube('#F3E2C4', p.acc); b.position.set(0.32, 0.1, 0.15); b.rotation.set(0, -0.4, Math.PI/2 - 0.1); g.add(b);
      g.scale.setScalar(1.3);
      return g;
    } },
  { id:'book', name:'책', cat:'그 밖에', main:['#2E3A6B','#B83A5E','#5E9C5A','#C99A6B'], acc:['#F2C14E','#FBF6EC','#9CC3E8','#E8577A'],
    build(p){
      const g = new THREE.Group();
      const bk = (c, y, ry, w, d, h) => {
        const b = new THREE.Group();
        b.add(mesh(Box(w, h, d), c, [0, 0, 0]));
        b.add(mesh(Box(w - 0.04, h - 0.04, d - 0.02), '#FFFDF7', [0.025, 0, 0]));
        b.add(mesh(Box(w, h + 0.004, 0.06), '#000000', [0, 0, d*0.3], [0, 0, 0]));
        b.children[2].material = M(c);
        b.position.y = y; b.rotation.y = ry; g.add(b); return b;
      };
      bk(p.main, 0.08, 0.1, 0.8, 1.0, 0.16);
      const top = bk(p.acc, 0.25, -0.25, 0.7, 0.9, 0.14);
      top.add(mesh(Box(0.04, 0.01, 0.35), '#D9334A', [0.15, -0.02, 0.6]));
      g.add(mesh(Box(0.03, 0.4, 0.03), '#5E9C5A', [0.1, 0.5, 0.1], [0.3, 0, 0.4]));
      g.add(mesh(Sph(0.07, 6, 4), '#E8577A', [0.18, 0.69, 0.16]));
      return g;
    } },
  { id:'fruit', name:'과일 바구니', cat:'식사', main:['#C99A6B','#FBF6EC','#8A5A3B','#B9C7A5'], acc:['#E8577A','#F2C14E','#9CC3E8','#FBF6EC'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Cyl(0.55, 0.4, 0.36, 10), p.main, [0, 0.18, 0]));
      g.add(mesh(new THREE.TorusGeometry(0.55, 0.04, 4, 12), p.main, [0, 0.36, 0], [Math.PI/2, 0, 0]));
      g.add(mesh(new THREE.TorusGeometry(0.5, 0.035, 4, 12, Math.PI), p.main, [0, 0.36, 0]));
      g.add(mesh(Box(0.12, 0.08, 0.08), p.acc, [-0.36, 0.72, 0]));
      g.add(mesh(Sph(0.06, 6, 4), p.acc, [-0.44, 0.72, 0], [0, 0, 0], [1.3, 0.8, 0.8]));
      const ap = (x, z, c) => { g.add(mesh(Sph(0.15, 8, 6), c, [x, 0.48, z])); g.add(mesh(Box(0.02, 0.07, 0.02), '#5A3A22', [x, 0.65, z])); };
      ap(-0.2, 0.15, '#D9334A'); ap(0.22, -0.18, '#D9334A');
      g.add(mesh(Sph(0.14, 8, 6), '#F08A3C', [0.2, 0.47, 0.18]));
      g.add(mesh(Sph(0.14, 8, 6), '#F08A3C', [-0.22, 0.47, -0.2]));
      for (let i = 0; i < 9; i++) g.add(mesh(Sph(0.055, 5, 4), '#7A3E8E', [0.02 + (i%3 - 1)*0.07, 0.62 - Math.floor(i/3)*0.07, 0.0 + (i%2)*0.04]));
      g.add(mesh(Box(0.02, 0.08, 0.02), '#5E9C5A', [0.02, 0.69, 0]));
      return g;
    } },
  { id:'meat', name:'고기 세트', cat:'식사', main:['#2B1E33','#D9334A','#C99A6B','#2E3A6B'], acc:['#D4AF37','#FBF6EC','#E8577A','#5E9C5A'],
    build(p){
      const g = new THREE.Group();
      g.add(mesh(Box(1.05, 0.24, 0.78), p.main, [0, 0.12, 0]));
      g.add(mesh(Box(0.97, 0.02, 0.7), '#FFFDF7', [0, 0.245, 0]));
      g.add(mesh(Box(1.07, 0.1, 0.12), p.acc, [0, 0.12, 0]));
      const steak = (x, z, ry) => {
        const s = new THREE.Group();
        s.add(mesh(Sph(0.25, 8, 5), '#C0394A', [0, 0, 0], [0, 0, 0], [1.25, 0.28, 0.95]));
        s.add(mesh(Box(0.3, 0.03, 0.03), '#F7E3E0', [0.02, 0.06, 0.05], [0, 0.4, 0]));
        s.add(mesh(Box(0.22, 0.03, 0.025), '#F7E3E0', [-0.08, 0.06, -0.08], [0, -0.3, 0]));
        s.add(mesh(Box(0.5, 0.06, 0.04), '#F7E3E0', [0, 0, 0.22], [0, 0.1, 0]));
        s.position.set(x, 0.32, z); s.rotation.y = ry; g.add(s);
      };
      steak(-0.22, 0, 0.2); steak(0.24, 0.02, -0.3);
      g.add(mesh(Box(0.12, 0.02, 0.12), '#5E9C5A', [0.0, 0.27, 0.25], [0, 0.6, 0]));
      const lid = new THREE.Group(); lid.position.set(0, 0.24, -0.39); lid.rotation.x = -1.25;
      lid.add(mesh(Box(1.05, 0.04, 0.78), p.main, [0, 0, 0.39]));
      lid.add(mesh(Box(1.06, 0.045, 0.12), p.acc, [0, 0, 0.39]));
      g.add(lid);
      return g;
    } },
  { id:'scarf', name:'목도리', cat:'생활', main:['#D9334A','#F3E2C4','#2E3A6B','#8FB35A'], acc:['#FBF6EC','#2B1E33','#F2C14E','#D9334A'],
    build(p){
      const g = new THREE.Group();
      const roll = new THREE.Group();
      roll.add(mesh(Cyl(0.27, 0.27, 0.62, 10), p.main, [0, 0, 0]));
      for (const y of [-0.18, 0, 0.18]) roll.add(mesh(Cyl(0.275, 0.275, 0.06, 10), p.acc, [0, y, 0]));
      roll.add(mesh(Cyl(0.12, 0.12, 0.63, 8), '#000000', [0, 0, 0]));
      roll.children[roll.children.length - 1].material = M(new THREE.Color(p.main).multiplyScalar(0.7));
      roll.rotation.z = Math.PI/2; roll.position.set(0, 0.27, -0.05);
      g.add(roll);
      const tail = new THREE.Group();
      tail.add(mesh(Box(0.42, 0.04, 0.5), p.main, [0, 0, 0.25]));
      for (const z of [0.12, 0.3]) tail.add(mesh(Box(0.43, 0.045, 0.05), p.acc, [0, 0, z]));
      for (let i = 0; i < 6; i++) tail.add(mesh(Box(0.03, 0.03, 0.1), p.main, [-0.18 + i*0.072, 0, 0.55]));
      tail.position.set(0.05, 0.52, 0.18); tail.rotation.set(1.15, 0.15, 0);
      g.add(tail);
      return g;
    } },
  { id:'doll', name:'곰 인형', cat:'그 밖에', main:['#C98A5A','#F3E2C4','#8A5A3B','#F7C6D0'], acc:['#E8577A','#9CC3E8','#F2C14E','#5E9C5A'],
    build(p){
      const g = new THREE.Group();
      const cream = '#F3E2C4', dark = '#2B1E33';
      g.add(mesh(Sph(0.3, 9, 7), p.main, [0, 0.3, 0], [0, 0, 0], [1, 1.1, 0.9]));
      g.add(mesh(Sph(0.18, 8, 6), cream, [0, 0.28, 0.19], [0, 0, 0], [1, 1.1, 0.45]));
      g.add(mesh(Sph(0.27, 9, 7), p.main, [0, 0.8, 0]));
      for (const s of [-1, 1]){
        g.add(mesh(Sph(0.09, 7, 5), p.main, [s*0.2, 1.0, -0.02]));
        g.add(mesh(Sph(0.05, 6, 4), cream, [s*0.2, 1.0, 0.04]));
        g.add(mesh(Sph(0.032, 5, 4), dark, [s*0.1, 0.86, 0.23]));
        g.add(mesh(Sph(0.1, 7, 5), p.main, [s*0.3, 0.4, 0.08], [0, 0, s*0.6], [1, 1.6, 1]));
        g.add(mesh(Sph(0.12, 7, 5), p.main, [s*0.15, 0.09, 0.17], [0, 0, 0], [1, 0.8, 1.4]));
        g.add(mesh(Sph(0.06, 6, 4), cream, [s*0.15, 0.09, 0.33], [0, 0, 0], [1, 1, 0.4]));
        g.add(mesh(Sph(0.07, 6, 4), p.acc, [s*0.09, 0.58, 0.22], [0, 0, s*0.5], [1.3, 0.7, 0.6]));
      }
      g.add(mesh(Sph(0.11, 7, 5), cream, [0, 0.74, 0.21], [0, 0, 0], [1, 0.8, 0.7]));
      g.add(mesh(Sph(0.035, 5, 4), dark, [0, 0.77, 0.3]));
      g.add(mesh(Sph(0.04, 5, 4), p.acc, [0, 0.58, 0.25]));
      return g;
    } },
  { id:'mystery', name:'미스터리 상자', cat:'그 밖에', main:['#9B7BD1','#2B1E33','#F2C14E','#E8577A'], acc:['#F2C14E','#FBF6EC','#E8577A','#9CC3E8'],
    build(p){
      const g = new THREE.Group();
      const S = 0.78;
      g.add(mesh(Box(S, S, S), p.main, [0, S/2, 0]));
      g.add(mesh(Box(S + 0.04, 0.1, S + 0.04), p.acc, [0, S - 0.1, 0]));
      const Q = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];
      const px = 0.07;
      const glyph = () => {
        const q = new THREE.Group();
        Q.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') q.add(mesh(Box(px, px, 0.02), p.acc, [(c - 2) * px, (3 - r) * px, 0])); }));
        return q;
      };
      for (let i = 0; i < 4; i++){
        const q = glyph(); const a = i * Math.PI / 2;
        q.position.set(Math.sin(a) * (S/2 + 0.01), S/2 - 0.04, Math.cos(a) * (S/2 + 0.01)); q.rotation.y = a;
        g.add(q);
      }
      const top = glyph(); top.position.set(0, S + 0.01, 0); top.rotation.x = -Math.PI/2; g.add(top);
      const cv = document.createElement('canvas'); cv.width = 160; cv.height = 72;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#FFFDF7'; cx.fillRect(0, 0, 160, 72);
      cx.strokeStyle = '#2B1E33'; cx.lineWidth = 4; cx.strokeRect(2, 2, 156, 68);
      cx.fillStyle = '#2B1E33'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      const txt = (p.text || '').trim() || '무엇일까요?';
      let fs = 22; cx.font = '600 ' + fs + 'px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
      while (cx.measureText(txt).width > 140 && fs > 11){ fs -= 1; cx.font = '600 ' + fs + 'px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'; }
      cx.fillText(txt, 80, 37);
      const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
      const tag = new THREE.Group();
      const tm = new THREE.MeshBasicMaterial({ map:tex, side:THREE.DoubleSide, transparent:true });
      tag.add(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.225), tm));
      tag.add(mesh(Box(0.015, 0.3, 0.015), '#C99A6B', [0.12, 0.25, 0], [0, 0, -0.5]));
      tag.position.set(0.3, 0.42, S/2 + 0.14); tag.rotation.set(-0.15, -0.25, 0.12);
      tag.userData.swing = true;
      g.add(tag);
      return g;
    } }
];
export const GIFT_TEMPLATES = TEMPLATES.map(t => ({ id: t.id, name: t.name, cat: t.cat }));
// 선물 하나를 만든다. 크기는 원본 단위(키 약 1)라서 쓰는 쪽에서 scale로 줄인다. variant: 색 고르기 번호(0~3)
export function makeGiftObject(id, variant = 0){
  const t = TEMPLATES.find(x => x.id === id) || TEMPLATES[0];
  const g = t.build({ main: t.main[variant % t.main.length], acc: t.acc[variant % t.acc.length] });
  const w = new THREE.Group(); w.add(g); w.userData = { template: t.id };
  return w;
}
