import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Fisher, Bucket, Block, Boat } from './Models';
import { CREW, SPOTS, MARKET, ROUTES } from '../lib/gameData';
import { routePoint } from './routes';
export { Customers } from './VillagerActors';

function workerPhase(game, type, preview, time){
  const worker=game?.workers.find(w=>w.id===type);
  if(preview)return (time+(type==='rod'?2:type==='net'?11:21))%30;
  if(!worker)return 0;
  const extra=game&&!game.paused?Math.min(3,(performance.now()-game.received)/1000)*game.speed:0;
  return (worker.elapsed+extra)%30;
}
export const CrewActor = ({type,gameRef,preview=false}) => {
  const ref=useRef(),rod=useRef(),carrying=useRef(),bucket=useRef(),boat=useRef(),fish=useRef();
  const data=CREW.find(c=>c.id===type),spot=SPOTS[type];
  useFrame(({clock})=>{
    const game=gameRef.current,worker=game?.workers.find(w=>w.id===type);
    if(!ref.current)return;ref.current.visible=preview||!!worker;
    if(bucket.current)bucket.current.visible=preview||!!worker;
    if(boat.current)boat.current.visible=preview||!!worker;
    if(!preview&&!worker)return;
    const phase=workerPhase(game,type,preview,clock.elapsedTime);
    const ratio=phase<12?0:phase<18?(phase-12)/6:phase<24?1:1-(phase-24)/6;
    const p=routePoint(ROUTES[type],ratio),moving=(phase>=12&&phase<18)||phase>=24;
    const bob=game?.paused?0:moving?Math.abs(Math.sin(phase*7))*.055:Math.sin(clock.elapsedTime*1.7)*.014;
    ref.current.position.set(p.x,p.y+bob,p.z);
    ref.current.rotation.y=ratio===0?(type==='boat'?-1.6:-Math.PI/2):p.angle+(phase>=24?Math.PI:0);
    rod.current.visible=phase<12;carrying.current.visible=phase>=12;
    bucket.current.visible=phase<12;
    if(fish.current)fish.current.visible=phase>3&&phase<12;
    if(boat.current){const sail=THREE.MathUtils.clamp(ratio*4.8,0,1);boat.current.position.set(spot[0],.2+(game?.paused?0:Math.sin(clock.elapsedTime*.9)*.04),THREE.MathUtils.lerp(15.5,12.7,sail));}
  });
  return <>
    <group ref={ref} position={spot}><group ref={rod}><Fisher color={data.color} kind={type}/></group><group ref={carrying} visible={false}><Fisher color={data.color} kind={type} pose="carry"/></group></group>
    <group ref={bucket} position={[spot[0]+.4,spot[1],spot[2]+.3]}><Bucket/><group ref={fish}><Block at={[0,.3,0]} size={[.08,.08,.24]} color="#dcd4b5"/></group></group>
    {type==='boat'&&<group ref={boat} position={[spot[0],.2,spot[2]]}><Boat/></group>}
  </>;
};

export const Snow=()=>{
  const ref=useRef();
  const positions=useMemo(()=>new Float32Array(Array.from({length:130*3},(_,i)=>i%3===1?Math.random()*12+1:(Math.random()-.5)*47)),[]);
  useFrame((_,delta)=>{if(!ref.current)return;const arr=ref.current.geometry.attributes.position.array;for(let i=0;i<arr.length;i+=3){arr[i+1]-=Math.min(delta,.05)*.32;arr[i]+=.001;if(arr[i+1]<1)arr[i+1]=13;}ref.current.geometry.attributes.position.needsUpdate=true;});
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial size={.028} color="#fff3e4" transparent opacity={.5} sizeAttenuation/></points>;
};

export const PlacementTarget=({type,onDeploy})=>{
  const ring=useRef(),spot=SPOTS[type];
  useFrame(({clock})=>{if(ring.current)ring.current.material.opacity=.7+Math.sin(clock.elapsedTime*3)*.25;});
  return <group position={[spot[0],spot[1]+.06,spot[2]]}>
    <mesh ref={ring} rotation={[-Math.PI/2,0,Math.PI/4]} onClick={event=>{event.stopPropagation();onDeploy();}}><ringGeometry args={[.72,.89,4]}/><meshBasicMaterial color="#ffe29f" transparent side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,1.1,0]} rotation={[0,0,Math.PI]}><coneGeometry args={[.18,.35,4]}/><meshBasicMaterial color="#ffdfa0"/></mesh>
  </group>;
};

export const MarketStock=({gameRef,preview})=>{
  const refs=useRef([]),coin=useRef();
  useFrame(({clock})=>{const stock=preview?7:gameRef.current?.market_stock||0;refs.current.forEach((ref,i)=>{if(ref)ref.visible=i<stock;});if(coin.current){coin.current.visible=!preview&&stock>0;coin.current.position.y=3.25+Math.sin(clock.elapsedTime*3)*.13;coin.current.rotation.y=clock.elapsedTime;}});
  return <group position={[MARKET[0],0,MARKET[2]]}>
    {Array.from({length:12},(_,i)=><group key={i} ref={el=>refs.current[i]=el}><Block at={[-.75+i%4*.47,2.39+Math.floor(i/4)*.09,.2+Math.floor(i/4)*.14]} size={[.11,.09,.38]} color={i%3?'#bcdbd4':'#e0c494'} rotation={[0,.3,0]}/></group>)}
    <mesh ref={coin} position={[.4,3.25,.3]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.15,.15,.04,8]}/><meshStandardMaterial color="#f3d18a" emissive="#d4ac51" emissiveIntensity={.4}/></mesh>
  </group>;
};