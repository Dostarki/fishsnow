import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export function useGame() {
  const [game, setGame] = useState(null);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [actionError, setActionError] = useState('');
  const actionPending = useRef(false);
  const token = useRef(localStorage.getItem('frostfish-session'));
  const gameRef = useRef(null);
  const latestRevision = useRef(-1);
  const accept = useCallback((state) => {
    if (state.revision >= latestRevision.current) {
      latestRevision.current = state.revision;
      gameRef.current = { ...state, received: performance.now() };
      setGame(state);
    }
  }, []);
  const request = useCallback(async (path, body) => {
    const res = await fetch(`${API}${path}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token.current ? { Authorization: `Bearer ${token.current}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await res.json();
    if (!res.ok) { const error = new Error(data.detail || 'The island is unreachable. Please try again.'); error.status = res.status; throw error; }
    return data;
  }, []);
  const start = useCallback(async () => {
    setBusy(true);
    try {
      if (token.current) {
        try { const saved = await request('/game'); accept(saved); setOnline(true); return saved; }
        catch (e) { if (!e.message.includes('expired')) throw e; }
      }
      const res = await request('/sessions', {});
      token.current = res.token;
      localStorage.setItem('frostfish-session', res.token);
      latestRevision.current = -1;
      accept(res.game); setOnline(true);
      return res.game;
    } catch (e) { toast.error(e.message); return null; } finally { setBusy(false); }
  }, [request, accept]);
  const act = useCallback(async (type, extra = {}) => {
    if (actionPending.current) return null;
    actionPending.current = true;
    setActionError('');
    setBusy(true);
    try {
      let state;
      for (let attempt = 0; attempt < 3; attempt++) {
        try { state = await request('/game/action', { type, ...extra }); break; }
        catch (e) {
          if (type === 'deploy') {
            // A response can be lost after a successful write. Reconcile before retrying.
            const current = await request('/game').catch(() => null);
            if (current?.workers.some(w => w.id === extra.character)) { state = current; break; }
          }
          if (e.status !== 409 || !e.message.includes('busy') || attempt === 2) throw e;
          await new Promise(resolve => setTimeout(resolve, 180 * (attempt + 1)));
        }
      }
      accept(state); setOnline(true); return state;
    } catch (e) { setActionError(e.message); toast.error(e.message); return null; }
    finally { actionPending.current = false; setBusy(false); }
  }, [request, accept]);
  const hasGame = !!game;
  useEffect(() => {
    if (!hasGame) return;
    let stopped = false, timer, polling = false;
    const poll = async () => {
      if(stopped||polling||document.hidden)return;
      if (actionPending.current) { timer = setTimeout(poll, 500); return; }
      polling=true;
      try { const state = await request('/game'); if (!stopped) { accept(state); setOnline(true); } }
      catch { if (!stopped) setOnline(false); }
      polling=false;
      if (!stopped) timer = setTimeout(poll, 1800);
    };
    const visible=()=>{if(!document.hidden){clearTimeout(timer);poll();}else clearTimeout(timer);};
    document.addEventListener('visibilitychange',visible);
    timer = setTimeout(poll, 1800);
    return () => { stopped = true; clearTimeout(timer);document.removeEventListener('visibilitychange',visible); };
  }, [hasGame, request, accept]);
  return { game, gameRef, start, act, busy, online, actionError, clearActionError: () => setActionError('') };
}