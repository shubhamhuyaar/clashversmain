'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { Editor } from '@/components/Editor';
import { OpponentPhantom } from '@/components/OpponentPhantom';
import { ProblemPane } from '@/components/ProblemPane';
import { Results } from '@/components/Results';
import { 
  Trophy, 
  Timer, 
  Zap, 
  ShieldCheck,
  Activity,
  Sword,
  Handshake,
  Flag
} from 'lucide-react';

function ArenaContent() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const searchParams = useSearchParams();
  const { connected, gameState, joinRoom, sendCodeUpdate, requestDraw, requestFinish, confirmDraw, rejectDraw, confirmFinish, rejectFinish } = useSocket();
  
  const initialLang = searchParams.get('lang') || 'python';
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(initialLang);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('clashvers_session');
    if (stored) {
      const sess = JSON.parse(stored);
      setSession(sess);
      if (connected && roomId) {
        joinRoom(roomId, sess.userId, sess.username, language);
      }
    } else {
      router.push('/');
    }
  }, [connected, roomId, joinRoom, router, language]);

  useEffect(() => {
    if (gameState.problem) {
      const starter = gameState.problem.starterCode?.[language] || '';
      setCode(starter);
    }
  }, [gameState.problem, language]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    sendCodeUpdate(newCode, language);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
  };

  const opponent = gameState.players.find(p => p.userId !== gameState.myUserId);

  if (gameState.status === 'revealed' && gameState.revealData) {
    return <Results battleState={gameState} onHome={() => router.push('/')} />;
  }

  if (gameState.status === 'waiting') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-mono">
        <div className="w-24 h-[1px] bg-white/20 mb-12 animate-pulse"></div>
        <div className="flex flex-col items-center gap-8">
            <div className="relative">
                <div className="w-16 h-16 border border-white/20 animate-spin flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                </div>
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-black font-orbitron tracking-[0.4em] text-white uppercase mb-4 animate-reveal">Arena Sync...</h2>
                <p className="text-[10px] text-neutral-600 tracking-[0.6em] uppercase font-bold px-6 py-2 border border-white/5 opacity-50">Room ID: {roomId}</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col text-white overflow-hidden uppercase selection:bg-white selection:text-black">
      {/* HUD - Ultra-Compact Action Protocol Layout */}
      <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-[#050505] z-50 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_#fff]"></div>
             <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black tracking-[0.2em] font-orbitron text-white leading-none truncate">{session?.username || 'OPERATIVE'}</span>
                <span className="text-[7px] text-neutral-600 font-bold tracking-widest mt-1">STATUS: LINK_UP</span>
             </div>
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-2 text-neutral-500">
             <Trophy className="w-3 h-3" />
             <span className="text-[10px] font-black font-orbitron tracking-widest text-white">{session?.elo || 1000}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white/5 border border-white/10 px-8 h-8 group hover:border-white/30 transition-all">
          <Timer className="w-4 h-4 text-white animate-pulse" />
          <span suppressHydrationWarning={true} className="text-xl font-black font-orbitron tracking-widest tabular-nums leading-none">
              {Math.max(0, Math.floor((gameState.matchDuration - (Date.now() - (gameState.matchStartedAt || Date.now()))) / 1000))}s
          </span>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={requestDraw}
             disabled={gameState.drawAttempts >= 3}
             className="flex items-center gap-3 border border-white/20 px-4 h-8 hover:bg-white hover:text-black transition-all group disabled:opacity-20"
           >
             <Handshake className="w-3.5 h-3.5" />
             <span className="text-[9px] font-black font-orbitron tracking-widest uppercase">Draw</span>
           </button>
           
           <button 
             onClick={requestFinish}
             className="flex items-center gap-3 bg-white text-black px-6 h-8 hover:bg-neutral-300 transition-all group border-none"
           >
             <Flag className="w-3.5 h-3.5" />
             <span className="text-[9px] font-black font-orbitron tracking-widest uppercase">Deploy</span>
           </button>
        </div>
      </header>

      {/* Main Workspace Strategy */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-black">
        
        {/* Top: Minimalist Problem Ribbon */}
        <section className="h-28 border-b border-white/10 bg-black flex flex-col relative z-20 shrink-0">
          <div className="flex-1 overflow-y-auto no-scrollbar custom-scrollbar">
            {gameState.problem && <ProblemPane problem={gameState.problem} />}
          </div>
          <div className="absolute right-6 bottom-2 opacity-10 pointer-events-none">
             <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </section>

        {/* Core Stack: Dual Workspace Split */}
        <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 h-full relative">
                <Editor 
                  code={code} 
                  onChange={handleCodeChange} 
                  language={language}
                  onLanguageChange={handleLanguageChange}
                />
            </div>
            <div className="w-1/2 h-full relative border-l border-white/10">
                <OpponentPhantom 
                   codeLength={gameState.opponentCodeLength}
                   username={opponent?.username || 'SEARCHING...'}
                   elo={opponent?.elo}
                />
            </div>
        </div>

        {/* Modal Intercepts */}
        {((gameState.drawPending && gameState.drawRequesterName !== session?.username) || 
          (gameState.finishPending && gameState.finishRequesterName !== session?.username)) && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-8">
             <div className="w-full max-w-sm border border-white p-10 bg-black text-center shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                <div className="mb-10">
                   <Sword className="w-10 h-10 text-white mx-auto mb-6" />
                   <h3 className="text-xl font-black font-orbitron tracking-[0.4em] uppercase mb-4">Protocol Event</h3>
                   <p className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase leading-loose border-y border-white/5 py-6">
                     {gameState.drawPending 
                       ? `OPPONENT PROPOSES DRAW.`
                       : `OPPONENT PROPOSES EARLY TERMINATION.`}
                   </p>
                </div>
                <div className="flex gap-4">
                   <button 
                     onClick={gameState.drawPending ? confirmDraw : confirmFinish}
                     className="flex-1 bg-white text-black py-4 font-black text-xs font-orbitron tracking-widest hover:bg-neutral-200 transition-all uppercase border-none"
                   >
                     ACCEPT
                   </button>
                   <button 
                     onClick={gameState.drawPending ? rejectDraw : rejectFinish}
                     className="flex-1 border border-white py-4 text-white font-black text-xs font-orbitron tracking-widest hover:bg-white/10 transition-all uppercase"
                   >
                     DENY
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Global Status Stream */}
      {gameState.errorMessage && (
        <div className="fixed bottom-10 left-10 bg-white text-black px-8 py-3 z-[110] flex items-center gap-4 shadow-[0_20px_50px_rgba(255,255,255,0.1)]">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-black tracking-[0.4em] uppercase">{gameState.errorMessage}</span>
        </div>
      )}

      {/* Evaluation Interface */}
      {gameState.aiEvaluating && (
        <div className="fixed inset-0 z-[150] bg-black/98 flex items-center justify-center">
            <div className="text-center space-y-12 animate-reveal">
               <div className="w-16 h-16 border border-white/10 border-t-white animate-spin mx-auto"></div>
               <div className="space-y-6">
                   <h2 className="text-4xl font-black font-orbitron tracking-[0.5em] text-white uppercase leading-none">Engine Sync...</h2>
                   <p className="text-[10px] font-mono text-neutral-600 tracking-[0.5em] uppercase border border-white/5 p-6 inline-block">
                     COMPILING PERSPECTIVE MATRICES. FINALIZING DUEL METRICS.
                   </p>
               </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default function BattleArena() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono animate-pulse uppercase tracking-[0.5em]">
            Allocating Core...
        </div>
    }>
        <ArenaContent />
    </Suspense>
  );
}
