import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const cache=new Map();
export const actorMaterial=new THREE.MeshLambertMaterial({vertexColors:true});
function colored(geometry,color){const c=new THREE.Color(color),arr=new Float32Array(geometry.attributes.position.count*3);for(let i=0;i<arr.length;i+=3){arr[i]=c.r;arr[i+1]=c.g;arr[i+2]=c.b;}geometry.setAttribute('color',new THREE.BufferAttribute(arr,3));return geometry;}
function merge(parts){const result=mergeGeometries(parts);parts.forEach(p=>p.dispose());result.computeBoundingSphere();return result;}
function builder(){const parts=[];return {parts,box(at,size,color,rotation=[0,0,0],parent){const g=colored(new THREE.BoxGeometry(...size),color);g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(1,1,1)));if(parent)g.applyMatrix4(parent);parts.push(g);},add(g,color,at=[0,0,0],rotation=[0,0,0]){colored(g,color);g.rotateX(rotation[0]);g.rotateY(rotation[1]);g.rotateZ(rotation[2]);g.translate(...at);parts.push(g);}};}

export function bucketGeometry(filled=false){
  const key=`bucket:${filled}`;if(cache.has(key))return cache.get(key);
  const b=builder();b.add(new THREE.CylinderGeometry(.18,.14,.3,6),'#88a9a3',[0,.15,0]);b.add(new THREE.TorusGeometry(.162,.018,3,6),'#d0ded2',[0,.31,0],[Math.PI/2,0,0]);
  if(filled){b.box([.03,.32,0],[.06,.05,.24],'#c8dce3',[0,.5,.3]);b.box([-.06,.32,.03],[.07,.07,.2],'#dfcf99');}
  const geo=merge(b.parts);cache.set(key,geo);return geo;
}

export function fisherGeometry(color,kind,pose){
  const key=`fisher:${color}:${kind}:${pose}`;if(cache.has(key))return cache.get(key);
  const b=builder();
  b.box([-.14,.12,.01],[.2,.25,.3],'#33464a');b.box([.14,.12,.01],[.2,.25,.3],'#33464a');
  b.box([0,.49,0],[.52,.55,.35],color);b.box([0,.31,-.19],[.4,.11,.05],'#ebc798');
  b.box([0,.9,0],[.4,.4,.36],'#e9be93');b.box([0,1.12,0],[.48,.19,.43],kind==='boat'?'#ecebdc':color);
  b.box([0,1.25,0],[.15,.13,.15],kind==='boat'?'#ddb565':'#ede9d6');b.box([0,.75,.2],[.35,.13,.08],'#e5e2d5');
  b.box([-.1,.94,.188],[.045,.05,.03],'#233d42');b.box([.1,.94,.188],[.045,.05,.03],'#233d42');b.box([0,.87,.22],[.1,.08,.08],'#d59972');
  b.box([-.33,.51,.05],[.15,.45,.18],color,[-.28,0,-.06]);
  const arm=new THREE.Matrix4().compose(new THREE.Vector3(.31,.6,.08),new THREE.Quaternion().setFromEuler(new THREE.Euler(-.55,0,.15)),new THREE.Vector3(1,1,1));
  b.box([0,-.1,.02],[.15,.36,.18],color,[0,0,0],arm);b.box([0,-.3,.02],[.14,.13,.15],'#e9be93',[0,0,0],arm);
  if(pose==='fishing'){
    const rod=arm.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(0,-.23,.06),new THREE.Quaternion().setFromEuler(new THREE.Euler(-.7,0,0)),new THREE.Vector3(1,1,1)));
    b.box([0,.59,0],[.045,1.4,.045],'#bb9262',[0,0,0],rod);
    if(kind==='net'){const g=colored(new THREE.TorusGeometry(.36,.022,4,8),'#e5c797');g.translate(0,1.38,0);g.applyMatrix4(rod);b.parts.push(g);}
    else b.box([0,.56,.37],[.012,1.45,.012],'#d9eddf',[.5,0,0],rod);
  }
  if(pose==='carry'||pose==='shopping'){const g=bucketGeometry(true).clone();g.translate(.42,.2,.1);b.parts.push(g);}
  const geo=merge(b.parts);cache.set(key,geo);return geo;
}

export function boatGeometry(){
  if(cache.has('boat'))return cache.get('boat');const b=builder();
  b.box([0,.05,0],[.95,.2,1.8],'#725946');b.box([-.53,.25,0],[.14,.38,1.8],'#b6814c');b.box([.53,.25,0],[.14,.38,1.8],'#b6814c');
  b.box([0,.25,-.94],[1.2,.38,.18],'#b6814c');b.box([0,.23,1],[.7,.3,.4],'#b6814c',[0,Math.PI/4,0]);
  b.box([0,.31,.45],[1,.08,.18],'#d9ac73');b.box([.69,.39,-.1],[.07,.06,2.4],'#d0b07b',[0,.28,0]);
  const geo=merge(b.parts);cache.set('boat',geo);return geo;
}