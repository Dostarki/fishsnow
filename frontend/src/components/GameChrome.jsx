import { useState } from 'react';
import { Fish, ArrowUpRight, ArrowRight, Plus, Minus, Focus, Volume2, VolumeX, Play, Pause, RotateCcw, BookOpen, Snowflake, Store, Users, MapPin, ChevronRight, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { CharacterArt } from './CharacterArt';
import { CREW } from '../lib/gameData';

export const Header = ({ active, onCrew, onMarket, onGuide, onWallet, address, online }) => <header className="site-header">
  <div className="brand" data-testid="frostfish-brand"><div className="brand-mark"><Fish size={30} strokeWidth={2.4} /><span>✦</span></div><div><strong>FROSTFISH</strong><span>A LITTLE WORLD OF YOUR OWN</span></div></div>
  <nav className="main-nav" aria-label="Island navigation"><span className="nav-current" data-testid="current-island-label"><span className="online-dot"/> The island</span><button onClick={onCrew} data-testid="nav-crew-button">{active ? 'Your crew' : 'Meet the crew'}</button><button onClick={onMarket} data-testid="nav-market-button">The market <ArrowUpRight size={13}/></button><button className="guide-nav" onClick={onGuide} data-testid="nav-guide-button">Field guide</button></nav>
  <button className="network-badge" data-testid="network-wallet-button" onClick={onWallet}><span className={`online-dot ${!online?'offline':''}`} /><span>{address ? `${address.slice(0,5)}…${address.slice(-4)}` : 'Robinhood Testnet'}</span><ChevronRight size={13}/></button>
</header>;

export const Welcome = ({ onPlay, onCrew, saved }) => <>
  <section className="welcome-copy">
    <div className="welcome-eyebrow" data-testid="welcome-eyebrow"><span className="tiny-star">✦</span> LESS RUSH. MORE RIVER.</div>
    <h1 data-testid="welcome-title">Small island.<br/><span>Big catch.</span></h1>
    <p data-testid="welcome-description">A fresh start, one catch at a time.</p>
    <Button className="pixel-button play-button" data-testid="play-button" onClick={onPlay}><Play size={21} fill="currentColor"/><span>{saved ? 'PLAY' : 'PLAY'}</span><ArrowRight size={23}/></Button>
    <div className="play-note" data-testid="free-entry-notice"><span className="online-dot"/> Free to play <span>·</span> A whole island to call home</div>
  </section>
  <section className="island-preview-note" data-testid="island-preview-note"><div className="preview-note-heading"><span>YOUR NEXT ADVENTURE</span><span>01 / ∞</span></div><div className="preview-note-body"><div className="mini-crew">{CREW.map(c=><CharacterArt key={c.id} type={c.id} small/>)}</div><h2>Good company.<br/>Even better catches.</h2><button className="meet-crew-link" onClick={onCrew} data-testid="preview-meet-crew-button">Meet your fishermen <ArrowUpRight size={16}/></button></div><div className="preview-note-bottom"><span className="online-dot"/> THREE FISHERMEN. ALL FREE.</div></section>
</>;

export const GameHUD = ({ game, onCrew, onMarket, onPause, busy, online }) => {
  const [expanded,setExpanded]=useState(false);
  return <>
  <div className="balance-hud" data-testid="balance-hud"><div className="balance-top"><span className="token-symbol"><Snowflake size={20}/></span><span>YOUR FROST</span><span className="demo-tag">DEMO</span></div><div className="balance-number" data-testid="frost-token-balance">{game.balance.toFixed(4)}</div><div className="balance-footer"><span className="online-dot"/><span data-testid="earning-rate">{game.paused ? 'Taking a breather' : `${game.workers.reduce((sum,w)=>sum+w.daily_yield,0)*game.speed} FROST / day · est.`}</span></div></div>
  <div className="island-session" data-testid="island-session"><span className="online-dot"/><span>{!online ? 'Reconnecting to island…' : game.paused ? 'ISLAND PAUSED' : 'YOUR ISLAND IS LIVE'}</span><span className="session-temp"><Snowflake size={13}/> −8°C</span></div>
  <section className={`crew-hud ${expanded?'crew-expanded':'crew-collapsed'}`}><div className="crew-hud-title"><Users size={15}/><span>YOUR CREW</span><span>{game.workers.length}/3</span><button className="crew-expand-button" title={expanded?'Collapse crew':'Expand crew'} aria-label={expanded?'Collapse crew':'Expand crew'} aria-expanded={expanded} data-testid="crew-panel-toggle" onClick={()=>setExpanded(v=>!v)}><ChevronUp size={18}/></button><button title="Add fisherman" aria-label="Add fisherman" data-testid="add-crew-button" onClick={onCrew}><Plus size={17}/></button></div>
    <div className="crew-list" data-testid="crew-list">
    {game.workers.length ? game.workers.map(w=><div className="worker-row" key={w.id} data-testid={`worker-${w.id}`}><CharacterArt type={w.id} small/><div className="worker-detail"><strong>{w.name}</strong><span data-testid={`worker-status-${w.id}`}>{game.paused ? 'Resting' : w.status}<span>{w.bucket}/{w.capacity} <Fish size={11}/></span></span><div className="bucket-progress"><i style={{width:`${w.bucket/w.capacity*100}%`}}/></div></div></div>) : <button className="empty-crew" onClick={onCrew} data-testid="empty-crew-button"><Plus size={19}/> Find your first fisherman</button>}
    </div><div className="crew-hud-bottom"><span data-testid="fish-caught-count"><Fish size={14}/> {game.fish_caught} caught</span><button onClick={onMarket} data-testid="hud-market-button"><Store size={14}/> Market <ArrowUpRight size={13}/></button></div>
  </section>
  <Button className="pause-control" data-testid="pause-game-button" onClick={onPause} disabled={busy} variant="ghost">{game.paused?<Play size={14}/>:<Pause size={14}/>} {game.paused?'Resume':'Pause'}</Button>
</>;
};

export const PlacementBar = ({ character, onDeploy, onCancel, busy }) => {
  const c = CREW.find(c=>c.id===character);
  return <section className="placement-bar" data-testid="placement-bar"><MapPin size={20}/><div><span>SETTLE INTO YOUR NEW SPOT</span><strong data-testid="placement-location">{c.location}</strong></div><Button className="pixel-button" data-testid="deploy-character-button" onClick={onDeploy} disabled={busy}>{busy?'Arriving…':'Place fisherman'}<ArrowRight/></Button><button className="placement-cancel" onClick={onCancel} data-testid="cancel-placement-button">Cancel</button></section>;
};

export const Footer = ({ active, sound, onSound, zoom, setZoom, onResetCamera, onGuide, onReset, onGraphics, speed, onSpeed, busy }) => <footer className="world-footer">
  <div className="world-location" data-testid="world-location"><span className="compass-symbol">✥</span><span>FROSTHAVEN <i>/</i> <b>REGION 01</b></span><span className="footer-coordinates">64° 08′ N &nbsp; 21° 56′ W</span></div>
  <div className="world-controls">
    {active && <button className="speed-button" title="Simulation speed" data-testid="speed-button" onClick={onSpeed} disabled={busy}>{speed}× <span>SPEED</span></button>}
    <div className="zoom-controls"><button title="Zoom out" aria-label="Zoom out" data-testid="zoom-out-button" onClick={()=>setZoom(Math.max(.7,zoom-.15))} disabled={zoom<=.7}><Minus size={16}/></button><button title="Reset view" aria-label="Reset view" data-testid="reset-camera-button" onClick={onResetCamera}><Focus size={17}/></button><button title="Zoom in" aria-label="Zoom in" data-testid="zoom-in-button" onClick={()=>setZoom(Math.min(1.6,zoom+.15))} disabled={zoom>=1.6}><Plus size={16}/></button></div>
    <button className={`sound-button ${sound?'sound-on':''}`} data-testid="sound-toggle-button" onClick={onSound} title={sound?'Mute ambience':'Enable ambience'} aria-label={sound?'Mute ambience':'Enable ambience'}>{sound?<Volume2 size={16}/>:<VolumeX size={16}/>}<span>SOUND {sound?'ON':'OFF'}</span><i/><i/><i/></button>
    <button className="footer-icon footer-guide" title="Field guide" aria-label="Field guide" data-testid="footer-guide-button" onClick={onGuide}><BookOpen size={16}/></button>
    {active && <button className="footer-icon footer-reset" title="Reset island" aria-label="Reset island" data-testid="reset-island-button" onClick={onReset}><RotateCcw size={16}/></button>}
    <button className="footer-icon graphics-control" title="Graphics & settings" aria-label="Graphics & settings" data-testid="graphics-settings-button" onClick={onGraphics}><SlidersHorizontal size={17}/></button>
  </div>
</footer>;