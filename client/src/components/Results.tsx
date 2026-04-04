'use client';

import React, { useEffect, useState } from 'react';
import { BattleStatus, BattleResult } from '@/types/game';
import { Trophy, Activity, BrainCircuit, Home, Loader2, X } from 'lucide-react';
import { getAIFeedback } from '@/services/geminiService';

interface ResultsProps {
  battleState: any; // Using any for now to avoid deep type nesting issues during transition
  onHome: () => void;
}

export const Results: React.FC<ResultsProps> = ({ battleState, onHome }) => {
  const [feedback, setFeedback] = useState<any>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (battleState.problem && battleState.myResult?.code) {
        setLoadingFeedback(true);
        try {
          const data = await getAIFeedback(
            battleState.problem, 
            battleState.myResult.code, 
            battleState.myLanguage
          );
          setFeedback(data);
        } catch (e) {
          console.error("Feedback error:", e);
        } finally {
          setLoadingFeedback(false);
        }
      }
    };
    fetchFeedback();
  }, [battleState.matchId]);

  const iWon = battleState.winnerId === battleState.players?.find((p: any) => p.userId === battleState.myUserId)?.userId;
  const isDraw = battleState.winnerId === 'draw';

  return (
    <div className="min-h-screen bg-black p-8 flex justify-center items-start overflow-y-auto relative z-50">
      <div className="max-w-4xl w-full space-y-12 animate-reveal">
        
        {/* Outcome Header */}
        <div className="border border-white/10 p-16 text-center relative bg-black/60 backdrop-blur-xl">
          <div className="flex justify-center mb-10">
             <div className="w-24 h-24 border-2 border-white flex items-center justify-center">
                {iWon ? <Trophy className="w-12 h-12" /> : isDraw ? <Activity className="w-12 h-12" /> : <X className="w-12 h-12" />}
             </div>
          </div>
          <h1 className="text-8xl font-black font-orbitron text-white mb-6 tracking-tighter uppercase leading-none">
            {isDraw ? 'Neutral' : iWon ? 'Victory' : 'Defeat'}
          </h1>
          <p className="text-[10px] text-neutral-500 font-mono tracking-[0.6em] uppercase font-bold">
            Combat Parameters Finalized — Node Synchronized
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 mt-20 border border-white/10">
            <StatBox 
              label="Test Vectors" 
              value={`${battleState.myResult?.passed}/${battleState.myResult?.total}`} 
              sub={`Target Met: ${Math.round((battleState.myResult?.passed / battleState.myResult?.total) * 100)}%`} 
            />
            <StatBox 
              label="Complexity" 
              value={battleState.myResult?.complexity || 'O(n)'} 
              sub="Heuristic Bound" 
            />
            <StatBox 
              label="Execution" 
              value={`${battleState.myResult?.normalizedExecutionTime ?? battleState.myResult?.executionTime}ms`} 
              sub="System Latency" 
            />
            <StatBox 
              label="Finalized" 
              value={`${battleState.myResult?.normalizedCompletionTime ?? battleState.myResult?.completionTime ?? '-'}s`} 
              sub="Duration" 
            />
          </div>
        </div>

        {/* AI Insight */}
        <div className="glass-panel p-12 border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-5">
              <BrainCircuit className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-black font-orbitron text-white tracking-[0.4em] uppercase">Intelligence Review</h2>
            </div>
            {loadingFeedback && (
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-neutral-500 animate-pulse uppercase tracking-widest">Parsing Stream...</span>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
               </div>
            )}
          </div>

          {feedback ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="lg:col-span-2 space-y-12">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] border-b border-white/5 pb-2">Heuristic Analysis</h3>
                  <p className="text-white leading-relaxed font-mono text-xs uppercase tracking-wide">{feedback.analysis}</p>
                </div>

                <div className="space-y-8">
                  <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] border-b border-white/5 pb-2">Refinement Protocol</h3>
                  <ul className="space-y-5">
                    {feedback.optimizationTips.map((tip: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-4 text-white text-[11px] font-mono group">
                        <span className="text-neutral-600 group-hover:text-white transition-colors">[{idx+1}]</span>
                        <span className="opacity-80 group-hover:opacity-100 transition-opacity uppercase">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-1 border-l border-white/10 pl-16 flex flex-col justify-center text-right">
                 <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.4em] mb-6">Complexity Bound</h3>
                 <div className="text-6xl font-black text-white font-orbitron leading-none">{feedback.complexity}</div>
                 <div className="text-[9px] text-neutral-700 font-mono mt-6 uppercase tracking-widest">Verified by Monolith Core</div>
              </div>
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center gap-8 opacity-20">
              <div className="w-full max-w-lg h-[1px] bg-white"></div>
              <div className="w-2/3 h-[1px] bg-white"></div>
              <div className="w-1/2 h-[1px] bg-white"></div>
              <span className="text-[11px] font-mono tracking-[0.8em] mt-12 uppercase">Awaiting Intelligence Stream...</span>
            </div>
          )}
        </div>

        <div className="flex justify-center pb-32">
          <button 
            onClick={onHome}
            className="flex items-center gap-5 border border-white/20 hover:border-white px-12 py-5 transition-all group bg-white/5"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[12px] font-black font-orbitron tracking-[0.5em] uppercase">Return to Terminal</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, sub }: any) => (
  <div className="bg-black p-8 flex flex-col justify-between text-left hover:bg-neutral-900 transition-colors">
    <div className="text-neutral-600 text-[9px] font-black uppercase tracking-[0.4em] mb-4">{label}</div>
    <div className="text-white font-orbitron font-bold text-2xl tracking-tighter leading-none">{value}</div>
    <div className="text-[9px] text-neutral-800 font-mono mt-4 uppercase tracking-widest">{sub}</div>
  </div>
);
