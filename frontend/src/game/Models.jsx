import { useMemo } from 'react';
import '@react-three/fiber';
import * as THREE from 'three';
import { actorMaterial, fisherGeometry, bucketGeometry, boatGeometry } from './mergedModels';

const cube=new THREE.BoxGeometry(1,1,1),materials=new Map();
function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshLambertMaterial({color}));return materials.get(color);}
export const Block=({at=[0,0,0],size=[1,1,1],color='#fff',rotation,...props})=><mesh position={at} scale={size} rotation={rotation} geometry={cube} material={material(color)} dispose={null} {...props}/>;
export const Fisher=({color='#d8844b',kind='rod',pose='fishing',...props})=><mesh geometry={fisherGeometry(color,kind,pose)} material={actorMaterial} dispose={null} {...props}/>;
export const Bucket=({filled=false,...props})=><mesh geometry={bucketGeometry(filled)} material={actorMaterial} dispose={null} {...props}/>;
export const Boat=props=><mesh geometry={boatGeometry()} material={actorMaterial} dispose={null} {...props}/>;
export const Sign=({position,text})=>{
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#37625d';ctx.fillRect(0,0,256,64);ctx.strokeStyle='#d9cda4';ctx.lineWidth=5;ctx.strokeRect(5,5,246,54);
    ctx.fillStyle='#fff5cf';ctx.font='bold 24px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,33);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[text]);
  return <group position={position}><Block at={[0,.55,0]} size={[.1,1.1,.1]} color="#957b56"/><mesh position={[0,1.1,.04]}><boxGeometry args={[1.3,.35,.1]}/><meshLambertMaterial map={texture}/></mesh></group>;
};