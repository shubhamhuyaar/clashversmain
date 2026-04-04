'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Code2, Users, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const syncSession = () => {
      const stored = localStorage.getItem('clashvers_session');
      setSession(stored ? JSON.parse(stored) : null);
    };

    syncSession();
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('clashvers_session');
    setSession(null);
    router.push('/');
  };

  const username = session?.username || 'Guest';
  const initial = username.charAt(0).toUpperCase();

  const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const isActive = pathname === href;
    return (
      <button 
        onClick={() => router.push(href)}
        className={`relative flex items-center gap-2 px-4 py-2 transition-all duration-300 ${
          isActive ? 'text-white' : 'text-neutral-500 hover:text-white'
        }`}
      >
        <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-neutral-600'}`} />
        <span className="text-[10px] font-bold tracking-widest uppercase">{label}</span>
        {isActive && <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-white"></span>}
      </button>
    );
  };

  return (
    <nav className="h-14 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-50">
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => router.push('/')}
      >
        <div className="p-1.5 border border-white/20 group-hover:border-white transition-all">
           <Code2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black font-orbitron tracking-tight text-white leading-none">
            CLASH<span className="opacity-40 tracking-widest">VERS</span>
          </span>
          <span className="text-[7px] text-neutral-600 font-mono tracking-[0.4em] uppercase mt-0.5">Monolith Mode</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1">
        <NavItem href="/career" icon={Users} label="COMMUNITY" />
        <NavItem href="/leaderboard" icon={Trophy} label="RANKS" />
      </div>

      <div className="flex items-center gap-4">
        {session ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[9px] font-black text-white font-orbitron tracking-widest uppercase truncate max-w-[80px]">{username}</div>
              <div className="text-[7px] text-neutral-600 font-mono flex items-center justify-end gap-1 uppercase">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div> Active
              </div>
            </div>
            <div className="w-7 h-7 border border-white/20 flex items-center justify-center text-white text-[10px] font-black font-orbitron bg-white/5">
              {initial}
            </div>
            <button onClick={handleLogout} className="p-1 px-2 border border-white/10 text-neutral-500 hover:text-white transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => router.push('/')}
            className="text-[9px] font-black font-orbitron tracking-widest text-white border border-white/20 px-4 py-1.5 hover:bg-white hover:text-black transition-all uppercase"
          >
            Entry Protocol
          </button>
        )}
      </div>
    </nav>
  );
};
