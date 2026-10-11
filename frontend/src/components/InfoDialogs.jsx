import { Fish, Store, Coins, Footprints, ArrowUpRight, RotateCcw } from 'lucide-react';
import { GameDialog } from './GameDialog';
import { Button } from './ui/button';
import { VillageResidents } from './VillageResidents';

export const MarketDialog = ({ open, onClose, game }) => <GameDialog open={open} onClose={onClose} id="market" title="The village market" subtitle="Fresh from Frostwater. A little something for everyone." className="market-dialog">
  <div className="market-status" data-testid="market-open-status"><span className="online-dot" /> OPEN FOR BUSINESS <Store size={18} /></div>
  <div className="market-stats"><div><Fish /><strong data-testid="market-stock">{game?.market_stock || 0}</strong><span>Fish on the counter</span></div><div><Footprints /><strong data-testid="customers-served">{game?.customers_served || 0}</strong><span>Happy customers</span></div><div><Coins /><strong data-testid="market-earnings">{(game?.balance || 0).toFixed(4)}</strong><span>FROST earned</span></div></div>
  {!!game?.villagers?.length&&<VillageResidents villagers={game.villagers} paused={game.paused}/>}
  <div className="ledger-heading"><span>ISLAND ACTIVITY</span><span>LIVE <span className="online-dot" /></span></div>
  <div className="activity-list" data-testid="market-activity">{game?.events.length ? game.events.map((event,i) => <div className="activity-item" key={`${event.at}-${i}`} data-testid={`activity-${i}`}><span className={`activity-icon ${event.kind}`}><ArrowUpRight size={15} /></span><span>{event.text}</span><time>{new Date(event.at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</time></div>) : <div className="empty-market" data-testid="market-empty">The counter is quiet. Your first catch will change that.</div>}</div>
</GameDialog>;

export const GuideDialog = ({ open, onClose }) => <GameDialog open={open} onClose={onClose} id="guide" title="A fisherman's field guide" subtitle="Life moves a little slower in Frosthaven." className="guide-dialog">
  <div className="guide-steps">{[[Fish,'01','Find your fishing spot','Choose a fisherman, then settle them at the bank, dock, or harbor. Each character has a spot of their own.'],[Footprints,'02','A bucketful of possibility','Your crew catches fish, fills their buckets, and walks each fresh catch to the village market.'],[Store,'03','Good fish. Happy neighbors.','Six neighbors leave their own cottages, queue for fresh fish, and carry their purchases back home. Every purchase adds demo FROST to your balance.']].map(([Icon,n,title,description])=><div className="guide-step" key={n} data-testid={`guide-step-${n}`}><span className="guide-icon"><Icon size={22}/></span><div><span className="step-number">{n}</span><h3>{title}</h3><p>{description}</p></div></div>)}</div>
  <p className="guide-footnote" data-testid="guide-demo-notice">Progress is saved in this browser's session. Earnings accrue while your island is open. Demo FROST has no monetary value and is not transferred on-chain.</p>
</GameDialog>;

export const ResetDialog = ({ open, onClose, onReset, busy }) => <GameDialog open={open} onClose={onClose} id="reset" title="A fresh start?" subtitle="This clears your crew, catches, and demo FROST balance. This cannot be undone.">
  <div className="reset-actions"><Button variant="outline" data-testid="cancel-reset-button" onClick={onClose}>Keep my island</Button><Button className="pixel-button" data-testid="confirm-reset-button" onClick={onReset} disabled={busy}><RotateCcw size={16}/> Start fresh</Button></div>
</GameDialog>;