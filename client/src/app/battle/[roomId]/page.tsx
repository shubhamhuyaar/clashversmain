'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSocket } from '@/hooks/useSocket';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-slate-500 text-sm" style={{ background: '#1e1e1e' }}>Loading editor…</div>,
});

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp'];

const STARTER: Record<string, string> = {
  javascript: `// Write your solution here\nfunction solution(nums, target) {\n  \n}\n`,
  typescript: `// Write your solution here\nfunction solution(nums: number[], target: number): number[] {\n  \n}\n`,
  python: `# Write your solution here\ndef solution(nums, target):\n    pass\n`,
  java: `// Write your solution here\npublic class Solution {\n    public int[] solve() {\n        return new int[]{};\n    }\n}\n`,
  cpp: `// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\nvoid solution() {}\n`,
};

function generateDummy(length: number): string {
  if (length === 0) return "// opponent hasn't started typing yet…";
  const lines: string[] = [];
  let rem = length;
  while (rem > 0) { const len = Math.min(rem, 45 + (rem % 23)); lines.push('█'.repeat(len)); rem -= len; }
  return lines.join('\n');
}

function fmtTime(s: number) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

export default function BattlePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const [myCode, setMyCode] = useState('');
  const [myLang, setMyLang] = useState('javascript');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [pendingName, setPendingName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [problemOpen, setProblemOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [playerIdx, setPlayerIdx] = useState<0 | 1 | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const lastSendRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { connected, gameState, joinRoom, sendCodeUpdate, requestDraw, confirmDraw, rejectDraw, requestFinish, confirmFinish, rejectFinish, sendChat } = useSocket();

  // Load identity from localStorage
  useEffect(() => {
    const id = localStorage.getItem('cw_userId');
    const name = localStorage.getItem('cw_username');
    if (id && name) { setUserId(id); setUsername(name); }
    else setShowModal(true);
  }, []);

  // Join room
  useEffect(() => {
    if (!userId || !username || !connected || !roomId || gameState.status !== 'idle') return;
    joinRoom(roomId, userId, username, myLang);
  }, [userId, username, connected, roomId, gameState.status, joinRoom, myLang]);

  // Starter code on lang change (only idle/waiting)
  useEffect(() => {
    if (gameState.status === 'idle' || gameState.status === 'waiting') setMyCode(STARTER[myLang]);
  }, [myLang, gameState.status]);

  // Player index
  useEffect(() => {
    if (gameState.players.length >= 1 && userId) {
      const idx = gameState.players.findIndex(p => p.userId === userId);
      if (idx !== -1) setPlayerIdx(idx as 0 | 1);
    }
  }, [gameState.players, userId]);

  // Countdown timer — uses server-provided startedAt + duration
  useEffect(() => {
    if (gameState.status !== 'active' || !gameState.matchStartedAt) return;
    const tick = () => {
      const elapsed = Date.now() - gameState.matchStartedAt!;
      const left = Math.max(0, Math.floor((gameState.matchDuration - elapsed) / 1000));
      setTimeLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gameState.status, gameState.matchStartedAt, gameState.matchDuration]);

  // Scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [gameState.chatMessages]);

  // Throttled code send (max 5/sec)
  const handleCodeChange = useCallback((code: string | undefined) => {
    if (!code) return;
    setMyCode(code);
    const now = Date.now();
    if (now - lastSendRef.current >= 200 && gameState.status === 'active') {
      lastSendRef.current = now;
      sendCodeUpdate(code, myLang);
    }
  }, [gameState.status, myLang, sendCodeUpdate]);

  // Sync language automatically to server when active status begins or language changes
  useEffect(() => {
    if (gameState.status === 'active') {
      sendCodeUpdate(myCode, myLang);
    }
  }, [gameState.status, myLang]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = pendingName.trim();
    if (!name) return;
    let id = localStorage.getItem('cw_userId');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('cw_userId', id); }
    localStorage.setItem('cw_username', name);
    setUserId(id); setUsername(name); setShowModal(false);
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim()); setChatInput('');
  };

  const opponent = gameState.players.find(p => p.userId !== userId);
  const me = gameState.players.find(p => p.userId === userId);
  const isRevealed = gameState.status === 'revealed';
  const revealedOpponent = gameState.revealData?.players.find(p => p.userId !== userId);
  const winner = gameState.revealData?.winner;
  const iWon = winner && winner !== 'draw' && playerIdx !== null
    ? (winner === 'player1' && playerIdx === 0) || (winner === 'player2' && playerIdx === 1)
    : false;
  const dummyText = useMemo(() => generateDummy(gameState.opponentCodeLength), [gameState.opponentCodeLength]);

  const editorOptions = { fontSize: 13, fontFamily: 'JetBrains Mono, monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbers: 'on' as const, padding: { top: 12 }, wordWrap: 'on' as const };

  const timerColor = timeLeft !== null && timeLeft < 60 ? 'var(--error)' : timeLeft !== null && timeLeft < 180 ? '#ffa502' : 'var(--on-surface)';

  // ── Username Modal ──────────────────────────────────────────────────────────
  if (showModal) return (
    <div style={{ height: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      {/* Top nav */}
      <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, display: 'flex', alignItems: 'center', padding: '0 32px', height: 80, background: 'rgba(14,14,16,0.60)', backdropFilter: 'blur(40px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: '#A7A9CC', fontStyle: 'italic' }}>Clashvers</div>
      </header>
      <div className="glass-panel" style={{ position: 'relative', zIndex: 1, borderRadius: 24, padding: '48px 40px', display: 'flex', flexDirection: 'column', gap: 20, minWidth: 400, textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Identify Yourself</h2>
        <p style={{ fontSize: 14, color: 'var(--secondary)' }}>Enter a username to enter the arena</p>
        <form onSubmit={handleUsernameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <input autoFocus value={pendingName} onChange={e => setPendingName(e.target.value)} placeholder="your_handle" maxLength={20}
            style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'var(--on-surface)', fontFamily: 'var(--font-sans)', fontSize: 15, outline: 'none', textAlign: 'center' }} />
          <button type="submit" style={{ padding: '15px', background: 'var(--primary)', color: '#131315', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, border: 'none', borderRadius: 12, cursor: 'pointer' }}>Enter Arena →</button>
        </form>
      </div>
    </div>
  );

  if (gameState.status === 'idle') return (
    <div style={{ height: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, position: 'relative' }}>
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, display: 'flex', alignItems: 'center', padding: '0 32px', height: 80, background: 'rgba(14,14,16,0.60)', backdropFilter: 'blur(40px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: '#A7A9CC', fontStyle: 'italic' }}>Clashvers</div>
      </header>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '2px solid rgba(167,169,204,0.15)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--secondary)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{connected ? 'Joining battle room…' : 'Connecting to server…'}</p>
      </div>
    </div>
  );

  // ── Waiting ────────────────────────────────────────────────────────────────
  if (gameState.status === 'waiting') return (
    <div style={{ height: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      {/* Radial glow */}
      <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(167,169,204,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Top nav */}
      <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', height: 80, background: 'rgba(14,14,16,0.60)', backdropFilter: 'blur(40px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: '#A7A9CC', fontStyle: 'italic' }}>Clashvers</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#4ade80' : 'var(--error)', boxShadow: connected ? '0 0 10px rgba(74,222,128,0.8)' : 'none', display: 'inline-block', animation: connected ? 'pulse-dot 2s ease-in-out infinite' : 'none' }} />
          <span style={{ fontSize: 12, color: connected ? '#4ade80' : 'var(--error)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{connected ? 'CONNECTED' : 'OFFLINE'}</span>
        </div>
      </header>

      {/* Main card */}
      <div className="glass-panel" style={{ position: 'relative', zIndex: 1, borderRadius: 28, padding: '56px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, textAlign: 'center', maxWidth: 560, width: '90%' }}>
        {/* Radar pulse visual */}
        <div style={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(167,169,204,0.2)', animation: `ping 2s ease-out ${i * 0.6}s infinite`, opacity: 0 }} />
          ))}
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(167,169,204,0.08)', border: '2px solid rgba(167,169,204,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(167,169,204,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          </div>
        </div>

        {/* Logo */}
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 40, letterSpacing: '-0.03em', fontStyle: 'italic', color: 'var(--primary)' }}>Clashvers</div>

        {/* Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Scanning for Opponent</div>
          <div style={{ fontSize: 14, color: 'var(--secondary)', lineHeight: 1.5 }}>Searching for a worthy challenger.<br />This may take a moment — stay sharp.</div>
        </div>

        {/* Room ID */}
        <div style={{ width: '100%', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--secondary)', letterSpacing: '0.05em' }}>ROOM ID</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)', letterSpacing: '0.05em', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roomId}</span>
        </div>

        {/* Share button */}
        <button onClick={() => { navigator.clipboard.writeText(window.location.href); }}
          style={{ padding: '14px 36px', background: 'var(--primary)', color: '#131315', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 12, cursor: 'pointer', letterSpacing: '-0.01em', width: '100%' }}>
          Invite Opponent — Copy Link
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 0% { transform: scale(0.4); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );

  // -- AI Evaluating Overlay
  const AIOverlay = gameState.aiEvaluating && !isRevealed ? (
    <div style={{ position:'absolute', inset:0, zIndex:50, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, background:'rgba(13,13,15,0.97)' }}>
      <div style={{ fontSize:56 }}>&#x1F916;</div>
      <p style={{ fontSize:20, fontWeight:800, color:'var(--on-surface)' }}>AI Judging Solutions</p>
      <div style={{ display:'flex', gap:8 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'var(--primary)', animation:`pulse-dot 1s ease-in-out ${i*0.3}s infinite` }} />)}
      </div>
      <p style={{ fontSize:13, color:'var(--secondary)', fontFamily:'var(--font-mono)' }}>Analyzing code quality</p>
    </div>
  ) : null;

  // -- Reveal Overlay
  const RevealOverlay = isRevealed ? (
    <div style={{ position:'absolute', inset:0, zIndex:50, display:'flex', flexDirection:'column', background:'var(--background)', overflowY:'auto', fontFamily:'var(--font-sans)' }}>
      <nav style={{ position:'sticky', top:0, zIndex:10, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 32px', height:80, background:'rgba(19,19,21,0.3)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
        <div style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.03em', color:'var(--primary)', fontStyle:'italic' }}>Clashvers</div>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          {['Arena','Rankings','Career','Hub'].map(l=><a key={l} href="/" style={{ color:'var(--on-surface-variant)', fontWeight:500, fontSize:14, textDecoration:'none' }}>{l}</a>)}
        </div>
        <button onClick={() => router.push('/')} style={{ padding:'8px 32px', borderRadius:9999, background:'var(--primary)', color:'#131315', fontWeight:600, fontSize:14, border:'none', cursor:'pointer' }}>Back to Arena</button>
      </nav>
      <main style={{ position:'relative', padding:'64px 32px 96px', maxWidth:1280, margin:'0 auto', width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ position:'absolute', inset:0, zIndex:-1, overflow:'hidden', pointerEvents:'none', opacity:0.2 }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:800, height:800, background:'rgba(194,196,232,0.2)', borderRadius:'50%', filter:'blur(120px)' }} />
        </div>
        <section style={{ textAlign:'center', marginBottom:48 }}>
          <h1 style={{ fontSize:64, fontWeight:600, letterSpacing:'-0.04em', fontStyle:'italic', textTransform:'uppercase', color:'var(--primary)', textShadow:'0 0 20px rgba(194,196,232,0.4)', lineHeight:1.1, marginBottom:16 }}>
            {winner === 'draw' ? 'DRAW' : iWon ? 'VICTORY' : 'DEFEAT'}
          </h1>
          <p style={{ fontSize:20, fontWeight:500, color:'var(--on-surface-variant)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
            {winner === 'draw' ? 'Both Competitors Fought Hard' : iWon ? 'Arena Dominance Achieved' : 'Better Luck Next Clash'}
          </p>
        </section>
        <section style={{ display:'grid', gridTemplateColumns:'repeat(12,1fr)', gap:24, width:'100%' }}>
          <div style={{ gridColumn:'span 4', display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(194,196,232,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, border:'1px solid rgba(194,196,232,0.2)' }}>&#x1F464;</div>
                <div>
                  <h3 style={{ fontSize:24, fontWeight:500, color:'var(--primary)', marginBottom:2 }}>{username}</h3>
                  <p style={{ fontSize:13, color:'var(--on-surface-variant)' }}>{iWon ? 'MVP Performance' : winner==='draw' ? 'Balanced Clash' : 'Valiant Effort'}</p>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:8 }}>
                  <span style={{ fontSize:11, color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Code Length</span>
                  <span style={{ fontFamily:'var(--font-mono)', color:'var(--primary)', fontSize:13 }}>{myCode.length} chars</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:8 }}>
                  <span style={{ fontSize:11, color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Language</span>
                  <span style={{ fontFamily:'var(--font-mono)', color:'var(--primary)', fontSize:13 }}>{myLang}</span>
                </div>
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderLeft:'4px solid var(--primary)', borderRadius:12, padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <span className="material-symbols-outlined" style={{ color:'var(--primary)', fontSize:20 }}>psychology</span>
                <h4 style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--primary)', fontWeight:500 }}>AI Evaluation</h4>
              </div>
              <p style={{ fontSize:15, color:'var(--on-surface)', fontStyle:'italic', lineHeight:1.7, marginBottom:16 }}>"{gameState.revealData?.explanation || 'Evaluating...'}"</p>
              {(() => {
                const e = gameState.revealData?.evaluations?.[userId];
                return e ? (
                  <div>
                    <p style={{ fontSize:12, color:'var(--on-surface-variant)', lineHeight:1.6, marginBottom:12 }}>{e.feedback}</p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span style={{ padding:'3px 10px', background:'rgba(194,196,232,0.1)', color:'var(--primary)', borderRadius:9999, fontSize:10, fontWeight:700, textTransform:'uppercase' }}>Code Quality</span>
                      <span style={{ padding:'3px 10px', background:'rgba(169,206,202,0.1)', color:'var(--secondary)', borderRadius:9999, fontSize:10, fontWeight:700, textTransform:'uppercase' }}>Implementation</span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
          <div style={{ gridColumn:'span 4', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 0' }}>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', inset:0, background:'rgba(194,196,232,0.1)', borderRadius:'50%', filter:'blur(48px)' }} />
              <div style={{ position:'relative', width:256, height:256, borderRadius:'50%', background:'rgba(255,255,255,0.03)', backdropFilter:'blur(40px)', border:'2px solid rgba(194,196,232,0.3)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                <div style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'72%', background:'linear-gradient(to top, rgba(194,196,232,0.4), rgba(194,196,232,0.05))' }} />
                <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:8 }}>ELO Delta</span>
                  <span style={{ fontSize:64, fontWeight:600, color:'white', lineHeight:1 }}>
                    {(() => { const d = gameState.eloDeltas?.[userId]; return d !== undefined ? (d >= 0 ? `+${d}` : `${d}`) : '?'; })()}
                  </span>
                  <div style={{ marginTop:8, padding:'4px 12px', background:'rgba(2,2,10,0.8)', borderRadius:9999, border:'1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontFamily:'var(--font-mono)', color:'var(--primary)', fontSize:12 }}>{me?.elo ? `${me.elo} ELO` : 'Ranked'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ gridColumn:'span 4', display:'flex', flexDirection:'column', gap:24 }}>
            {gameState.revealData?.players.filter(p => p.userId !== userId).map(p => {
              const evalData = gameState.revealData?.evaluations?.[p.userId];
              const oppDelta = gameState.eloDeltas?.[p.userId];
              return (
                <div key={p.userId} style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'12px 20px', background:'rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--tertiary)' }}>{p.username}</span>
                      <span style={{ fontSize:11, color:'var(--secondary)', fontFamily:'var(--font-mono)' }}>[{p.language}]</span>
                    </div>
                    {oppDelta !== undefined && <span style={{ padding:'2px 10px', borderRadius:9999, fontSize:11, fontWeight:900, background:oppDelta>=0?'rgba(169,206,202,0.12)':'rgba(255,180,171,0.12)', color:oppDelta>=0?'var(--secondary)':'var(--error)', fontFamily:'var(--font-mono)' }}>{oppDelta>=0?`+${oppDelta}`:`${oppDelta}`} ELO</span>}
                  </div>
                  <div style={{ height:180 }}>
                    <MonacoEditor height="100%" language={p.language} value={p.code} theme="vs-dark" options={{ ...editorOptions, readOnly:true }} />
                  </div>
                  {evalData && <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.08)', background:'rgba(0,0,0,0.3)' }}>
                    <p style={{ fontSize:11, color:'var(--on-surface-variant)', lineHeight:1.6 }}>{evalData.feedback}</p>
                  </div>}
                </div>
              );
            })}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:16, display:'flex', flexDirection:'column', alignItems:'center' }}>
                <span className="material-symbols-outlined" style={{ color:'var(--secondary)', marginBottom:8 }}>military_tech</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:20, color:'var(--secondary)', fontWeight:500 }}>{iWon?'WIN':winner==='draw'?'DRAW':'LOSS'}</span>
                <span style={{ fontSize:10, color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>Result</span>
              </div>
              <div style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:16, display:'flex', flexDirection:'column', alignItems:'center' }}>
                <span className="material-symbols-outlined" style={{ color:'var(--tertiary)', marginBottom:8 }}>code</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:16, color:'var(--tertiary)', fontWeight:500 }}>{myLang}</span>
                <span style={{ fontSize:10, color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>Language</span>
              </div>
            </div>
          </div>
        </section>
        <section style={{ marginTop:48, display:'flex', flexWrap:'wrap', justifyContent:'center', gap:24 }}>
          <button onClick={() => navigator.clipboard?.writeText(window.location.href)} style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', padding:'16px 32px', borderRadius:24, display:'flex', alignItems:'center', gap:16, color:'var(--primary)', cursor:'pointer', fontSize:14, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em' }}>
            <span className="material-symbols-outlined">share</span> Share Result
          </button>
          <button onClick={() => router.push('/')} style={{ background:'var(--primary)', padding:'16px 40px', borderRadius:24, display:'flex', alignItems:'center', gap:16, color:'#131315', cursor:'pointer', fontSize:14, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', border:'none', boxShadow:'0 20px 40px rgba(194,196,232,0.2)' }}>
            <span className="material-symbols-outlined">play_arrow</span> Queue Next
          </button>
        </section>
      </main>
      <footer style={{ width:'100%', padding:'24px 48px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(2,2,10,0.2)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.05)', flexShrink:0, fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase' }}>
        <div style={{ color:'rgba(255,255,255,0.3)' }}>2024 CLASHVERS. PROTOCOL INITIATED.</div>
        <div style={{ display:'flex', gap:32 }}>
          {['Privacy Grid','Terms of Combat','Neural Link'].map(l=><a key={l} href="#" style={{ color:'rgba(255,255,255,0.25)', textDecoration:'none' }}>{l}</a>)}
        </div>
        <div style={{ fontWeight:700, color:'rgba(169,206,202,0.5)' }}>SYSTEM_STABLE</div>
      </footer>
    </div>
  ) : null;


  // ── Draw Request Modal ─────────────────────────────────────────────────────
  const isOpponentDraw = gameState.drawPending && gameState.drawRequesterName !== null;
  const DrawModal = isOpponentDraw ? (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="flex flex-col items-center gap-6 text-center" style={{
        background: 'rgba(10,0,0,0.92)',
        border: '1px solid rgba(255,180,171,0.3)',
        borderRadius: '1.5rem',
        padding: '2.5rem 3rem',
        minWidth: 360,
        boxShadow: '0 0 60px rgba(255,180,171,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        <div className="text-5xl">🤝</div>
        <div>
          <p className="text-white font-bold text-xl mb-2 tracking-wide">Draw Request</p>
          <p className="text-sm" style={{ color: 'var(--secondary)' }}>
            <strong style={{ color: 'var(--error)' }}>{gameState.drawRequesterName}</strong> wants to call a draw
          </p>
        </div>
        <div className="h-px w-full" style={{ background: 'rgba(255,180,171,0.15)' }} />
        <div className="flex gap-4 w-full">
          <button
            onClick={() => { confirmDraw(); }}
            className="flex-1 py-3 rounded-xl font-bold text-white text-sm tracking-widest uppercase transition-all hover:brightness-110"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 20px rgba(255,180,171,0.3)' }}
          >✓ Accept</button>
          <button
            onClick={() => { rejectDraw(); }}
            className="flex-1 py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'var(--secondary)' }}
          >✕ Reject</button>
        </div>
      </div>
    </div>
  ) : null;

  // ── Finish Early Modal ─────────────────────────────────────────────────────
  const isOpponentFinish = gameState.finishPending && gameState.finishRequesterName !== null;
  const FinishModal = isOpponentFinish ? (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="flex flex-col items-center gap-6 text-center" style={{
        background: 'rgba(10,0,0,0.92)',
        border: '1px solid rgba(255,180,171,0.3)',
        borderRadius: '1.5rem',
        padding: '2.5rem 3rem',
        minWidth: 380,
        boxShadow: '0 0 60px rgba(255,180,171,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        <div className="text-5xl">🏁</div>
        <div>
          <p className="text-white font-bold text-xl mb-2 tracking-wide">Early Submit Request</p>
          <p className="text-sm" style={{ color: 'var(--secondary)' }}>
            <strong style={{ color: 'var(--error)' }}>{gameState.finishRequesterName}</strong> is done and wants to submit early.
          </p>
        </div>
        <div className="h-px w-full" style={{ background: 'rgba(255,180,171,0.15)' }} />
        <div className="flex gap-4 w-full">
          <button
            onClick={() => { confirmFinish(); }}
            className="flex-1 py-3 rounded-xl font-bold text-white text-sm tracking-widest uppercase transition-all hover:brightness-110"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 20px rgba(255,180,171,0.3)' }}
          >🏁 Submit Now</button>
          <button
            onClick={() => { rejectFinish(); }}
            className="flex-1 py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'var(--secondary)' }}
          >⌨ Keep Coding</button>
        </div>
      </div>
    </div>
  ) : null;

  // ── Arena ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--background)', overflow:'hidden', position:'relative', fontFamily:'var(--font-sans)' }}>
      {AIOverlay}
      {RevealOverlay}
      {DrawModal}
      {FinishModal}

      {/* Top Nav */}
      <nav style={{ position:'fixed', top:0, width:'100%', zIndex:50, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 32px', height:80, background:'rgba(19,19,21,0.3)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 24px rgba(0,0,0,0.4)' }}>
        {/* Left: Logo + problem */}
        <div style={{ display:'flex', alignItems:'center', gap:32 }}>
          <span style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.03em', color:'var(--primary)', fontStyle:'italic' }}>Clashvers</span>
          <span style={{ fontSize:13, color:'var(--on-surface-variant)', fontFamily:'var(--font-mono)', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{gameState.problem?.title ?? '…'}</span>
        </div>

        {/* Center: Timer pill */}
        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ padding:'4px 24px', background:'rgba(20,20,22,0.4)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderTop:'1px solid rgba(194,196,232,0.3)', borderRadius:9999, display:'flex', alignItems:'center', gap:12 }}>
            <span className="material-symbols-outlined" style={{ fontSize:16, color:'var(--secondary)' }}>timer</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:24, fontWeight:500, color:'var(--secondary)', letterSpacing:'0.1em', textShadow:'0 0 10px rgba(169,206,202,0.8), 0 0 20px rgba(169,206,202,0.4)' }}>
              {timeLeft !== null ? fmtTime(timeLeft) : '00:00'}
            </span>
          </div>
        </div>

        {/* Right: Status + actions */}
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontFamily:'var(--font-mono)', color: connected ? 'var(--secondary)' : 'var(--error)' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background: connected ? 'var(--secondary)' : 'var(--error)', boxShadow: connected ? '0 0 8px rgba(169,206,202,0.8)' : 'none', display:'inline-block' }} />
            {connected ? 'Synchronized' : 'Offline'}
          </span>
          {gameState.status === 'active' && (
            <button onClick={requestFinish} disabled={!!gameState.finishPending}
              style={{ padding:'8px 16px', background:'rgba(194,196,232,0.1)', border:'1px solid rgba(194,196,232,0.3)', color:'var(--primary)', borderRadius:8, fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, cursor:'pointer', opacity: gameState.finishPending ? 0.4 : 1 }}>
              🏁 {gameState.finishPending ? 'Pending…' : 'Submit Early'}
            </button>
          )}
          {gameState.status === 'active' && (
            <button onClick={requestDraw} disabled={!!gameState.drawPending || gameState.drawAttempts >= 3}
              style={{ padding:'8px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--on-surface-variant)', borderRadius:8, fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, cursor:'pointer', opacity:(gameState.drawPending||gameState.drawAttempts>=3)?0.4:1 }}>
              🤝 {gameState.drawPending ? 'Pending…' : `Draw (${3 - gameState.drawAttempts})`}
            </button>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex:1, marginTop:80, padding:'24px 32px', display:'flex', gap:24, overflow:'hidden', height:'calc(100vh - 80px)' }}>

        {/* Left: Monaco Editor */}
        <section style={{ flex:1, display:'flex', flexDirection:'column', gap:16, minWidth:0 }}>
          {/* Editor title bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 8px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span className="material-symbols-outlined" style={{ fontSize:20, color:'var(--primary)' }}>terminal</span>
              <span style={{ fontSize:20, fontWeight:500, color:'var(--on-surface)', letterSpacing:'-0.01em' }}>{username || 'You'}.{myLang}</span>
              <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700, background:'rgba(194,196,232,0.1)', color:'var(--primary)', border:'1px solid rgba(194,196,232,0.2)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Write Mode</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:13, color:'var(--outline)', letterSpacing:'0.02em', fontFamily:'var(--font-mono)' }}>Chars: {myCode.length}</span>
              <select value={myLang} onChange={e => setMyLang(e.target.value)}
                style={{ padding:'4px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--on-surface)', borderRadius:6, fontFamily:'var(--font-mono)', fontSize:11, outline:'none', cursor:'pointer' }}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Problem collapsed bar */}
          {!problemOpen && (
            <button onClick={() => setProblemOpen(true)} style={{ padding:'6px 16px', textAlign:'left', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, color:'var(--secondary)', fontSize:11, fontFamily:'var(--font-mono)', cursor:'pointer' }}>
              📋 {gameState.problem?.title} — click to expand
            </button>
          )}
          {problemOpen && gameState.problem && (
            <div style={{ flexShrink:0, maxHeight:140, overflowY:'auto', padding:'12px 16px', position:'relative', background:'rgba(20,20,22,0.4)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12 }}>
              <button onClick={() => setProblemOpen(false)} style={{ position:'absolute', top:8, right:12, background:'none', border:'none', color:'var(--secondary)', cursor:'pointer', fontSize:14 }}>✕</button>
              <p style={{ fontWeight:600, color:'var(--on-surface)', marginBottom:4, fontSize:13 }}>{gameState.problem.title}</p>
              <p style={{ color:'var(--on-surface-variant)', fontSize:12, lineHeight:1.65, marginBottom:6 }}>{gameState.problem.description}</p>
              <pre style={{ color:'var(--outline)', fontSize:11, fontFamily:'var(--font-mono)', whiteSpace:'pre-wrap', wordBreak:'break-all', lineHeight:1.5, margin:0 }}>{gameState.problem.examples}</pre>
            </div>
          )}

          {/* Glass editor card */}
          <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', background:'rgba(20,20,22,0.4)', backdropFilter:'blur(40px)', border:'1px solid rgba(194,196,232,0.2)', borderRadius:24, overflow:'hidden', boxShadow:'0 0 15px rgba(194,196,232,0.1)' }}>
            {/* Editor chrome bar */}
            <div style={{ height:40, background:'rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', padding:'0 16px', justifyContent:'space-between', flexShrink:0 }}>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(255,180,171,0.4)' }} />
                <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(220,197,145,0.4)' }} />
                <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(169,206,202,0.4)' }} />
              </div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.05em' }}>Clashvers-IDE v1.0.4</span>
            </div>
            {/* Monaco */}
            <div style={{ flex:1, minHeight:0 }}>
              <MonacoEditor height="100%" language={myLang} value={myCode} theme="vs-dark" onChange={handleCodeChange} options={editorOptions} />
            </div>
          </div>
        </section>

        {/* Right: HUD Sidebar */}
        <aside style={{ width:384, display:'flex', flexDirection:'column', gap:24, overflow:'hidden' }}>

          {/* Opponent Card */}
          <div style={{ background:'rgba(20,20,22,0.4)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:24, position:'relative', overflow:'hidden' }}>
            {/* Live indicator */}
            <div style={{ position:'absolute', top:12, right:12, padding:8 }}>
              <span className="material-symbols-outlined" style={{ fontSize:16, color:'var(--error)', fontVariationSettings:"'FILL' 1" }}>sensors</span>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
              <div style={{ position:'relative' }}>
                <div style={{ width:64, height:64, borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', overflow:'hidden', background:'rgba(116,118,143,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>⚔</div>
                <div style={{ position:'absolute', bottom:-4, right:-4, padding:'2px 6px', background:'var(--error)', fontSize:8, fontWeight:700, borderRadius:4, color:'white', textTransform:'uppercase', letterSpacing:'-0.02em' }}>LIVE</div>
              </div>
              <div>
                <h3 style={{ fontSize:20, fontWeight:500, color:'var(--on-surface)', lineHeight:1.2 }}>{opponent?.username ?? 'Opponent'}</h3>
                <p style={{ fontSize:13, color:'var(--outline)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>{opponent?.elo ? `${opponent.elo} ELO` : 'Unknown'}</p>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                <span style={{ color:'var(--outline)', textTransform:'uppercase', letterSpacing:'0.1em', fontSize:10 }}>Code Progress</span>
                <span style={{ color:'var(--secondary)', fontFamily:'var(--font-mono)', fontSize:13 }}>{gameState.opponentCodeLength} chars</span>
              </div>
              {/* Progress bar */}
              <div style={{ height:8, width:'100%', background:'rgba(255,255,255,0.05)', borderRadius:9999, overflow:'hidden', border:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ height:'100%', background:'var(--secondary)', boxShadow:'0 0 10px rgba(169,206,202,0.5)', transition:'width 0.5s ease', width:`${Math.min(100, (gameState.opponentCodeLength/500)*100)}%` }} />
              </div>
              {gameState.opponentCodeLength > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:10, color:'rgba(169,206,202,0.6)', fontFamily:'var(--font-mono)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:12 }}>keyboard</span>
                  OPPONENT IS TYPING...
                </div>
              )}
              {!isRevealed && gameState.opponentCodeLength === 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:10, color:'var(--outline)', fontFamily:'var(--font-mono)' }}>
                  🔒 Code locked until match ends
                </div>
              )}
            </div>
          </div>

          {/* Stats bento grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'rgba(20,20,22,0.4)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:24 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>My ELO</div>
              <div style={{ fontSize:24, fontWeight:500, color:'var(--on-surface)', fontFamily:'var(--font-mono)' }}>{me?.elo ?? '—'}</div>
            </div>
            <div style={{ background:'rgba(20,20,22,0.4)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:24 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Enemy ELO</div>
              <div style={{ fontSize:24, fontWeight:500, color:'var(--on-surface)', fontFamily:'var(--font-mono)' }}>{opponent?.elo ?? '—'}</div>
            </div>
          </div>

          {/* System Log (replaces chat) */}
          <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', background:'rgba(20,20,22,0.4)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, overflow:'hidden' }}>
            <div style={{ background:'rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.1)', padding:'8px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--outline)', textTransform:'uppercase', letterSpacing:'0.1em' }}>System Log</span>
              <span className="material-symbols-outlined" style={{ fontSize:16, color:'var(--outline)' }}>terminal</span>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:8 }}>
              {gameState.chatMessages.length === 0 ? (
                <div style={{ display:'flex', gap:8, fontSize:12, fontFamily:'var(--font-mono)' }}>
                  <span style={{ color:'var(--secondary)' }}>[00:00]</span>
                  <span style={{ color:'rgba(194,196,232,0.6)' }}>Connection established to Arena</span>
                </div>
              ) : gameState.chatMessages.map((msg, i) => (
                <div key={i} style={{ display:'flex', gap:8, fontSize:12, fontFamily:'var(--font-mono)', wordBreak:'break-all' }}>
                  <span style={{ color: msg.userId === userId ? 'var(--secondary)' : 'var(--tertiary)', flexShrink:0 }}>{msg.username}:</span>
                  <span style={{ color:'rgba(194,196,232,0.7)' }} dangerouslySetInnerHTML={{ __html: msg.message }} />
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {/* Command input */}
            <form onSubmit={handleChat} style={{ padding:12, borderTop:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.2)', display:'flex', gap:12, alignItems:'center', flexShrink:0 }}>
              <span style={{ color:'var(--secondary)', fontWeight:700, fontFamily:'var(--font-mono)', fontSize:14 }}>&gt;</span>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Send message…" maxLength={200}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13, color:'var(--on-surface)', fontFamily:'var(--font-mono)' }} />
              <button type="submit" style={{ background:'none', border:'none', cursor:'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize:16, color:'var(--secondary)' }}>send</span>
              </button>
            </form>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer style={{ width:'100%', padding:'12px 48px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(2,2,10,0.2)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:10, fontWeight:700, color:'rgba(169,206,202,0.5)', letterSpacing:'0.05em' }}>CLASHVERS</span>
          <span style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)' }}>© 2024 PROTOCOL INITIATED.</span>
        </div>
        <div style={{ display:'flex', gap:32 }}>
          {['Privacy Grid','Terms of Combat','Neural Link'].map(l => (
            <a key={l} href="#" style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', textDecoration:'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--secondary)', boxShadow:'0 0 8px rgba(169,206,202,0.8)' }} />
          <span style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--secondary)' }}>Synchronized</span>
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 0% { transform: scale(0.4); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}
