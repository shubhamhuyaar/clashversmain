'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TopNav({ active }: { active: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { id: 'arena', label: 'Arena', path: '/' },
    { id: 'rankings', label: 'Rankings', path: '/leaderboard' },
    { id: 'career', label: 'Career', path: '/career' },
    { id: 'hub', label: 'Hub', path: '/hub' },
  ];

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 24px', minHeight: 80,
        background: 'rgba(14,14,16,0.80)',
        backdropFilter: 'blur(40px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: '#A7A9CC', fontStyle: 'italic', cursor: 'pointer' }}
          onClick={() => router.push('/')}>
          Clashvers
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(link => {
            const isActive = active === link.id;
            return (
              <a key={link.id} onClick={() => router.push(link.path)}
                style={{
                  fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em', fontWeight: 500,
                  cursor: 'pointer', textDecoration: 'none',
                  color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                  background: isActive ? 'rgba(167,169,204,0.1)' : 'transparent',
                  padding: isActive ? '8px 16px' : '8px 0',
                  borderRadius: isActive ? 9999 : 0,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--on-surface)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--on-surface-variant)'; }}
              >{link.label}</a>
            );
          })}
        </nav>

        {/* Desktop Action & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button className="hidden md:block" onClick={() => router.push('/')} style={{ padding: '10px 24px', background: 'var(--primary)', color: 'var(--on-primary)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 10, cursor: 'pointer', letterSpacing: '-0.01em' }}>Battle Now</button>
          
          <button className="md:hidden flex justify-center items-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Window */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-md pt-24 px-6 flex flex-col gap-6" onClick={() => setMenuOpen(false)}>
           <div className="flex flex-col gap-2 bg-[#131315] p-6 rounded-3xl border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-white/50 uppercase text-[10px] tracking-widest font-bold mb-2 ml-2">Navigation</h2>
              {links.map(link => {
                const isActive = active === link.id;
                return (
                  <button key={link.id} onClick={() => { setMenuOpen(false); router.push(link.path); }}
                    className={`text-left p-4 rounded-2xl text-lg font-bold transition-all ${isActive ? 'bg-[#A7A9CC]/10 text-[#c2c4e8]' : 'text-gray-300 hover:bg-white/5'}`}>
                    {link.label}
                  </button>
                );
              })}
              <button onClick={() => { setMenuOpen(false); router.push('/'); }} className="mt-4 p-4 rounded-2xl text-[#131315] font-bold text-lg text-center" style={{background: '#c2c4e8'}}>
                Battle Now
              </button>
           </div>
        </div>
      )}
    </>
  );
}
