'use client';

import React from 'react';
import { EyeOff, Activity } from 'lucide-react';

interface OpponentPhantomProps {
  codeLength: number;
  username: string;
  elo?: number;
}

export const OpponentPhantom: React.FC<OpponentPhantomProps> = ({ 
  codeLength, 
  username, 
  elo 
}) => {
  // Estimate lines: roughly 40 chars per line
  const lineCount = Math.max(1, Math.floor(codeLength / 40));
  
  // Dummy line widths for aesthetic variety
  const lineWeights = [0.8, 0.4, 0.6, 0.9, 0.3, 0.75, 0.5];

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] font-mono text-xs relative overflow-hidden border-l border-white/5 opacity-80 transition-all duration-1000 group hover:opacity-100">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a0a] z-10">
        <div className="flex items-center gap-4">
           <EyeOff className="w-4 h-4 text-neutral-500" />
           <div className="flex flex-col">
              <span className="text-[11px] font-black text-white uppercase tracking-[0.4em] font-orbitron">
                ENCRYPTED_RIVAL
              </span>
              <span className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest leading-none mt-1">
                {username} // ID: {username.slice(0, 4).toUpperCase()}
              </span>
           </div>
        </div>
        <div className="text-[10px] text-white font-orbitron font-black tracking-widest bg-white/5 px-4 py-1.5 border border-white/10 group-hover:border-white/40 transition-colors">
            {elo || '0000'} ELO
        </div>
      </div>

      <div className="flex-1 p-10 relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]">
        {/* Progress Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none cyber-grid-small"></div>
        
        {/* Placeholder Lines Visualization */}
        <div className="space-y-4">
          {[...Array(Math.min(lineCount, 25))].map((_, i) => (
            <div key={i} className="flex gap-4 items-center animate-reveal" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="text-[9px] text-neutral-800 font-mono w-6 text-right select-none">{i + 1}</span>
              <div 
                className="h-2.5 bg-neutral-900 border border-white/5 shadow-[0_0_10px_rgba(255,255,255,0.02)] transition-all duration-700" 
                style={{ 
                  width: `${lineWeights[i % lineWeights.length] * 100}%`,
                  opacity: 0.1 + (((i * 137) % 30) / 100)
                }}
              ></div>
            </div>
          ))}
          
          {lineCount > 25 && (
            <div className="text-[9px] text-neutral-800 font-mono pl-10 pt-4 uppercase tracking-[0.5em]">
              ... {lineCount - 25} Additional Blocks ...
            </div>
          )}
        </div>

        {/* Global Monitoring Overlay */}
        <div className="absolute bottom-10 right-10 flex flex-col items-end gap-3 pointer-events-none opacity-40">
           <div className="text-[8px] font-black font-mono tracking-[0.5em] text-neutral-500 uppercase">Input Vector Intercepted</div>
           <div className="flex items-center gap-3">
              <span className="text-[10px] text-white font-mono tracking-widest uppercase font-bold">LEN_{codeLength}</span>
              <Activity className="w-4 h-4 text-white" />
           </div>
        </div>
      </div>
      
      {/* Visual Glitch Frame */}
      <div className="absolute inset-0 pointer-events-none border border-white/0 group-hover:border-white/5 transition-all duration-1000"></div>
    </div>
  );
};
