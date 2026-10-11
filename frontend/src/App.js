import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { useGame } from './hooks/useGame';
import { useAmbience } from './hooks/useAmbience';
import { Header, Welcome, GameHUD, PlacementBar, Footer } from './components/GameChrome';
import { WalletDialog } from './components/WalletDialog';
import { CrewDialog } from './components/CrewDialog';
import { MarketDialog, GuideDialog, ResetDialog } from './components/InfoDialogs';
import { Toaster } from './components/ui/sonner';
import { SunsetSky } from './components/SunsetSky';
import { GraphicsDialog } from './components/GraphicsDialog';
import { WalletHandoffNotice } from './components/WalletHandoffNotice';
import { useGraphics } from './hooks/useGraphics';
import { useWalletHandoff } from './hooks/useWalletHandoff';
import './App.css';
import './sunset.css';
import './mobile.css';
const World=lazy(()=>import('./game/World').then(module=>({default:module.World})));

export default function App() {
  const { game, gameRef, start, act, busy, online, actionError, clearActionError } = useGame();
  const [modal, setModal] = useState(null);
  const [placement, setPlacement] = useState(null);
  const [zoom, setZoom] = useState(1), [cameraReset, setCameraReset] = useState(0);
  const { address } = useAccount();
  const { sound, toggle } = useAmbience();
  const active = !!game;
  const graphics=useGraphics();
  const walletFlow=useWalletHandoff(setModal);
  const openCrew=useCallback(()=>setModal('crew'),[]);
  const openMarket=useCallback(()=>setModal('market'),[]);
  const openGuide=useCallback(()=>setModal('guide'),[]);
  const openWallet=useCallback(()=>setModal('wallet'),[]);
  const openSpot=useCallback(()=>setModal(active?'crew':'wallet'),[active]);
  const openGraphics=useCallback(()=>setModal('graphics'),[]);
  const openReset=useCallback(()=>setModal('reset'),[]);
  const begin = async () => {
    walletFlow.cancel();
    const state = await start();
    if (state) { setModal(state.workers.length ? null : 'crew'); toast.success(state.workers.length ? 'Welcome back to Frosthaven.' : 'Welcome to your little corner of the world.'); }
  };
  const choose = (character) => {
    if (!active) { setModal('wallet'); return; }
    clearActionError();
    setPlacement(character); setModal(null);
  };
  const deploy = useCallback(async () => {
    if(busy||!placement)return;
    const state = await act('deploy', { character: placement });
    if (state) { setPlacement(null); toast.success('Your fisherman is settling in. First catch coming up!'); }
  },[act,busy,placement]);
  useEffect(() => {
    const handle = event => {
      if (event.code === 'Space' && active && !modal && !busy && !['BUTTON','INPUT','TEXTAREA'].includes(event.target.tagName)) { event.preventDefault(); act('pause'); }
      if (event.code === 'Escape') setPlacement(null);
    };
    window.addEventListener('keydown', handle); return ()=>window.removeEventListener('keydown', handle);
  }, [active, modal, busy, act]);
  return <main className={`frostfish-app ${active?'is-playing':''}`} data-testid="frostfish-app" data-graphics-tier={graphics.profile.tier} data-render-paused={!!modal||walletFlow.connectModalOpen||graphics.hidden}>
    <SunsetSky/>
    <Suspense fallback={<div className="world-loading" data-testid="world-loading">Preparing Frosthaven<span>···</span></div>}>
      <World gameRef={gameRef} active={active} zoom={zoom} reset={cameraReset} placement={placement} onDeploy={deploy} onMarket={openMarket} onSpot={openSpot} profile={graphics.profile} onMeasure={graphics.measure} blocked={!!modal||walletFlow.connectModalOpen||graphics.hidden}/>
    </Suspense>
    <Header active={active} address={address} online={online} onCrew={openCrew} onMarket={openMarket} onGuide={openGuide} onWallet={openWallet}/>
    {!active && <div className="region-caption" data-testid="region-caption"><span className="region-diamond">◇</span><span>THE NORTHERN ISLES</span><span>Somewhere between winter & wonder</span></div>}
    {active ? <GameHUD game={game} busy={busy} online={online} onCrew={openCrew} onMarket={openMarket} onPause={()=>act('pause')}/> : <Welcome onPlay={openWallet} onCrew={openCrew}/>}
    {placement && <PlacementBar character={placement} busy={busy} onDeploy={deploy} onCancel={()=>setPlacement(null)}/>}
    {actionError && <div role="alert" className="action-error" data-testid="game-action-error">{actionError}<button onClick={clearActionError} data-testid="dismiss-action-error-button" aria-label="Dismiss error">×</button></div>}
    <Footer active={active} sound={sound} onSound={toggle} zoom={zoom} setZoom={setZoom} onResetCamera={()=>{setZoom(1);setCameraReset(v=>v+1);}} onGuide={openGuide} onReset={openReset} onGraphics={openGraphics} speed={game?.speed||1} onSpeed={()=>act('speed',{speed:game.speed===4?1:game.speed*2})} busy={busy}/>
    {modal==='wallet'&&<WalletDialog open onClose={()=>setModal(null)} onStart={begin} onChooseWallet={walletFlow.choose} busy={busy}/>}
    {modal==='crew'&&<CrewDialog open onClose={()=>setModal(null)} onSelect={choose} workers={game?.workers}/>}
    {modal==='market'&&<MarketDialog open onClose={()=>setModal(null)} game={game}/>}
    {modal==='guide'&&<GuideDialog open onClose={()=>setModal(null)}/>}
    {modal==='graphics'&&<GraphicsDialog open onClose={()=>setModal(null)} graphics={graphics} onGuide={openGuide} onReset={openReset} active={active}/>}
    {modal==='reset'&&<ResetDialog open onClose={()=>setModal(null)} busy={busy} onReset={async()=>{const result=await act('reset');if(result){setPlacement(null);setModal('crew');toast.success('A fresh start for Frosthaven.');}}}/>}
    {!modal&&(walletFlow.showNotice||walletFlow.expired)&&<WalletHandoffNotice expired={walletFlow.expired} onRetry={walletFlow.choose} onBack={()=>{walletFlow.cancel();openWallet();}} onDismiss={walletFlow.cancel}/>}
    <Toaster theme="dark" position="top-center" toastOptions={{className:'frost-toast'}}/>
  </main>;
}