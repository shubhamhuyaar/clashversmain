'use client';

import React from 'react';
import { ChevronDown, Code2 } from 'lucide-react';

interface EditorProps {
  code: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange?: (lang: string) => void;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ 
  code, 
  onChange, 
  language, 
  onLanguageChange,
  readOnly = false 
}) => {
  const languages = ['python', 'javascript', 'cpp', 'java', 'go'];

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] font-mono text-xs relative border-r border-white/5">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a0a] z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <Code2 className="w-4 h-4 text-white opacity-80" />
             <span className="text-[11px] font-black text-white uppercase tracking-[0.4em] font-orbitron">
               SOURCE_STREAM
             </span>
          </div>
          
          {/* Language Selector */}
          <div className="relative group">
            <select
              value={language}
              onChange={(e) => onLanguageChange?.(e.target.value)}
              disabled={readOnly}
              className="appearance-none bg-black border border-white/20 text-white text-[10px] font-black font-orbitron px-5 py-2 pr-10 tracking-[0.2em] uppercase focus:outline-none focus:border-white transition-all cursor-pointer hover:bg-neutral-900"
            >
              {languages.map(lang => (
                <option key={lang} value={lang} className="bg-black text-white">{lang.toUpperCase()}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span className="text-[9px] text-neutral-400 font-black uppercase tracking-widest leading-none">
              {readOnly ? 'LOCKED' : 'ENCRYPTED_RW'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const newCode = code.substring(0, start) + '    ' + code.substring(end);
              onChange(newCode);
              setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 4;
              }, 0);
            }
          }}
          className="w-full h-full bg-[#050505] text-white p-10 resize-none focus:outline-none leading-[1.8] font-mono selection:bg-white selection:text-black text-base md:text-lg border-none custom-scrollbar uppercase tracking-wide"
          spellCheck={false}
          readOnly={readOnly}
          placeholder="// BEGIN EXECUTION_..."
          style={{ fontFamily: 'var(--font-fira-code)' }}
        />
      </div>
    </div>
  );
};
