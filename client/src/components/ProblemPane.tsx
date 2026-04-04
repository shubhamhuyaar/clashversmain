'use client';

import React from 'react';
import { Problem } from '@/types/game';
import { Target, ShieldAlert, Cpu } from 'lucide-react';

interface ProblemPaneProps {
  problem: Problem | null;
}

export const ProblemPane: React.FC<ProblemPaneProps> = ({ problem }) => {
  if (!problem) return (
    <div className="h-full flex items-center justify-center p-4 text-[10px] text-white font-mono uppercase tracking-[0.5em] animate-pulse font-black">
      Synchronizing Protocol...
    </div>
  );

  return (
    <div className="h-full px-8 py-3 bg-black text-white selection:bg-white selection:text-black">
      {/* Header Info */}
      <div className="mb-3 flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <span className={`px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest ${
               problem.difficulty === 'hard' ? 'border-red-500 text-red-500' : 'border-white/40 text-white'
             }`}>
               THREAT_LEVEL: {problem.difficulty.toUpperCase()}
             </span>
             <span className="text-[8px] text-neutral-600 font-mono tracking-widest uppercase truncate max-w-[100px]">ID: {problem.id?.toUpperCase() || 'CORE'}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-orbitron tracking-tighter leading-none uppercase">{problem.title}</h2>
        </div>
        
        <div className="flex gap-6">
           <QuickStat icon={Target} label="Vectors" value={problem.testCases.length} />
           <QuickStat icon={ShieldAlert} label="Rules" value={problem.constraints.length} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Description Section */}
        <div className="md:col-span-1 space-y-3">
          <SectionLabel label="Briefing" icon={Cpu} />
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-500 leading-relaxed text-[10px] font-medium tracking-wide uppercase font-mono line-clamp-3">
              {problem.description}
            </p>
          </div>
        </div>

        {/* Constraints */}
        <div className="md:col-span-1 space-y-3">
          <SectionLabel label="Constraints" />
          <ul className="space-y-1.5 overflow-y-auto max-h-16 no-scrollbar">
            {problem.constraints.map((c, i) => (
              <li key={i} className="text-[9px] font-mono text-neutral-600 flex gap-2">
                <span className="text-white opacity-20 font-black">[{i+1}]</span> <span className="truncate">{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Example Vector */}
        <div className="md:col-span-1 space-y-3">
          <SectionLabel label="I/O Vector [01]" />
          {problem.testCases[0] && (
            <div className="border border-white/5 p-2 bg-white/[0.01] text-[9px] font-mono space-y-1">
              <div className="flex justify-between uppercase"><span className="text-neutral-700">In:</span> <span className="text-white truncate max-w-[80px]">{problem.testCases[0].input}</span></div>
              <div className="flex justify-between uppercase"><span className="text-neutral-700">Out:</span> <span className="text-white truncate max-w-[80px]">{problem.testCases[0].expectedOutput}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionLabel = ({ label, icon: Icon }: any) => (
  <div className="flex items-center gap-2 opacity-30 mb-1">
    {Icon && <Icon className="w-2.5 h-2.5 text-white" />}
    <h3 className="text-[9px] font-black text-white uppercase tracking-[0.3em]">{label}</h3>
  </div>
);

const QuickStat = ({ icon: Icon, label, value }: any) => (
  <div className="text-right">
    <div className="flex items-center justify-end gap-1.5 text-neutral-600 mb-0.5">
       <Icon className="w-2.5 h-2.5" />
       <span className="text-[7px] font-bold tracking-widest uppercase">{label}</span>
    </div>
    <div className="text-lg font-black font-orbitron text-white leading-none uppercase">{value}</div>
  </div>
);
