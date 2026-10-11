import { useAccount, useSwitchChain, useDisconnect } from 'wagmi';
import { ArrowRight, Wallet, Sprout, ShieldCheck, Loader2, Smartphone } from 'lucide-react';
import { GameDialog } from './GameDialog';
import { Button } from './ui/button';
import { robinhood } from '../lib/wallet';

export const WalletDialog=({open,onClose,onStart,onChooseWallet,busy})=>{
  const {isConnected,address,chainId}=useAccount();
  const {switchChain,isPending,error}=useSwitchChain();
  const {disconnect}=useDisconnect();
  const wrongNetwork=isConnected&&chainId!==robinhood.id;
  return <GameDialog open={open} onClose={onClose} id="wallet" title="Your island awaits." subtitle="A small escape. A brand-new adventure." className="wallet-dialog">
    <div className="wallet-emblem"><Wallet size={30} strokeWidth={1.5}/><span className="online-dot"/></div>
    {isConnected?<>
      <p className="connected-address" data-testid="connected-wallet-address">{address.slice(0,6)}…{address.slice(-4)}</p>
      <Button className="pixel-button" data-testid="wallet-continue-button" disabled={busy||isPending} onClick={()=>wrongNetwork?switchChain({chainId:robinhood.id}):onStart('wallet')}>
        {isPending?<Loader2 className="spin"/>:<Wallet/>}{wrongNetwork?'Switch to Robinhood testnet':busy?'Opening your island…':'Enter island'}<ArrowRight/>
      </Button>
      <button className="text-button" data-testid="disconnect-wallet-button" onClick={()=>disconnect()}>Disconnect wallet</button>
    </>:<>
      <Button className="pixel-button" data-testid="connect-wallet-button" onClick={onChooseWallet}><Wallet/> Choose your wallet <ArrowRight/></Button>
      <div className="supported-wallets" data-testid="supported-wallets"><span>MetaMask</span><span>Rainbow</span><span>Base</span></div>
      <p className="mobile-wallet-note" data-testid="mobile-wallet-note"><Smartphone size={16}/><span>On mobile, choose an installed wallet to open its app. After approval, return to Frostfish.</span></p>
    </>}
    {error&&<p role="alert" className="form-error" data-testid="wallet-error">{error.shortMessage||'Network switch was declined. Try again or play the demo.'}</p>}
    <div className="or-divider">or take the scenic route</div>
    <Button variant="outline" className="demo-button" data-testid="free-demo-button" onClick={()=>onStart('demo')} disabled={busy}><Sprout size={18}/>{busy?'Opening your island…':'Play free demo'}<ArrowRight size={18}/></Button>
    <p className="wallet-note" data-testid="wallet-demo-notice"><ShieldCheck size={16}/> No payment. No signatures. Just fishing.</p>
    <div className="network-note" data-testid="wallet-network-note"><span className="online-dot"/> Robinhood Chain Testnet <span>·</span> Demo tokens only</div>
  </GameDialog>;
};