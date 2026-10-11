import { useState } from 'react';
import { Check, ArrowRight, Fish, Sparkles } from 'lucide-react';
import { GameDialog } from './GameDialog';
import { Button } from './ui/button';
import { CharacterArt } from './CharacterArt';
import { CREW } from '../lib/gameData';

export const CrewDialog = ({ open, onClose, onSelect, workers=[] }) => {
  const [selected, setSelected] = useState(()=>CREW.find(c=>!workers.some(w=>w.id===c.id))?.id||'rod');
  const deployed = workers.some(w => w.id === selected);
  return <GameDialog open={open} onClose={onClose} id="crew" title="Every great catch starts somewhere." subtitle="Three fishermen. Three ways to make this island your own." className="crew-dialog">
    <div className="crew-options">{CREW.map((c,i) => {
      const isDeployed = workers.some(w => w.id === c.id);
      return <button key={c.id} className={`crew-option ${selected === c.id ? 'selected' : ''}`} data-testid={`character-card-${c.id}`} onClick={() => setSelected(c.id)} aria-pressed={selected === c.id}>
        <div className="crew-option-top"><span>0{i+1} / {c.role}</span>{selected === c.id && <span className="selected-check"><Check size={14} /></span>}</div>
        <div className={`character-stage stage-${c.id}`}><CharacterArt type={c.id} /></div>
        <h3 data-testid={`character-name-${c.id}`}>{c.name}</h3><p className="character-subtitle">{c.subtitle}</p>
        <div className="yield"><Sparkles size={14} /><strong data-testid={`daily-yield-${c.id}`}>{c.daily_yield}</strong><span>FROST / day</span></div>
        <div className="character-capacity"><Fish size={14} /><span>{c.capacity} fish per trip</span><span className="free-label">FREE</span></div>
        <div className="character-selected-label" data-testid={`character-status-${c.id}`}>{isDeployed ? 'Already on your island' : selected === c.id ? '✓ Selected' : 'Choose fisherman'}</div>
      </button>;
    })}</div>
    <div className="crew-dialog-footer"><p data-testid="yield-disclaimer">Estimated at 1× speed, while playing.<br /><span>FROST is an in-game demo token with no monetary value.</span></p><Button className="pixel-button" data-testid="select-character-button" disabled={deployed} onClick={() => onSelect(selected)}>{deployed ? 'Already deployed' : `Choose ${CREW.find(c=>c.id===selected).name}`}<ArrowRight /></Button></div>
  </GameDialog>;
};