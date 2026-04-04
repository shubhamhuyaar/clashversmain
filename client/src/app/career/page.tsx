'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Activity, History, Shield, Zap, Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserStats {
  id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  created_at: string;
}

interface MatchHistory {
  id: string;
  status: string;
  winner_id: string | null;
  created_at: string;
  problem_data: any;
}

export default function CareerPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserStats | null>(null);
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const userId = session.user.id;

      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) setProfile(profileData as UserStats);

      // Matches
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (matchData) setMatches(matchData as MatchHistory[]);
      setLoading(false);
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono uppercase tracking-[0.5em] animate-pulse">
        SYNCING PROFILE...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 flex justify-center bg-black relative">
      <div className="max-w-5xl w-full flex flex-col items-center">
        {/* Profile Large Header */}
        <header className="w-full mb-20 mt-16 text-center animate-reveal">
           <div className="w-40 h-40 border-2 border-white mx-auto mb-10 flex items-center justify-center group hover:bg-white transition-all overflow-hidden duration-700">
              <span className="text-6xl font-black font-orbitron group-hover:text-black transition-colors duration-700">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
           </div>
           
           <h1 className="text-6xl font-black font-orbitron tracking-tighter uppercase text-white mb-6">
             {profile?.username || 'OPERATIVE'}
           </h1>
           
           <div className="flex items-center justify-center gap-12 mt-12 border-y border-white/5 py-8">
              <ProfileStat label="Elo Rating" value={Math.floor(profile?.rating || 500)} />
              <div className="w-px h-12 bg-white/10"></div>
              <ProfileStat label="Sorties" value={(profile?.wins || 0) + (profile?.losses || 0)} />
              <div className="w-px h-12 bg-white/10"></div>
              <ProfileStat label="Cleared" value={profile?.wins || 0} />
           </div>
        </header>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full mb-24">
          {/* Main Sortie History */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-[10px] font-black font-orbitron text-white tracking-[0.5em] uppercase px-4 border-l-2 border-white mb-8">Sortie History</h2>
            <div className="space-y-px bg-white/5 border border-white/10">
              {matches.length > 0 ? matches.map((match) => {
                const won = match.winner_id === profile?.id;
                const draw = !match.winner_id && match.status === 'finished';
                return (
                  <div key={match.id} className="p-8 bg-black hover:bg-neutral-900 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                       <div className={`p-2 border ${won ? 'border-white text-white' : 'border-neutral-800 text-neutral-800'}`}>
                          {won ? <Shield className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                       </div>
                       <div>
                          <div className="text-[11px] font-black font-orbitron text-white uppercase tracking-widest leading-none">
                            {match.problem_data?.title || 'Unknown Protocol'}
                          </div>
                          <div className="text-[8px] font-mono text-neutral-600 mt-2 uppercase tracking-tighter">
                            {new Date(match.created_at).toLocaleString()}
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className={`text-[10px] font-black font-orbitron uppercase tracking-widest ${won ? 'text-white' : 'text-neutral-700'}`}>
                          {draw ? 'NEUTRAL' : won ? 'CLEAR' : 'FAILED'}
                       </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-16 text-center font-mono text-neutral-800 uppercase tracking-widest bg-black">No missions logged.</div>
              )}
            </div>
          </div>

          {/* Quick Specs / Skills */}
          <div className="space-y-8">
            <h2 className="text-[10px] font-black font-orbitron text-white tracking-[0.5em] uppercase px-4 border-l-2 border-white mb-8">System Specs</h2>
            <div className="glass-panel p-8 bg-white/[0.02] border-white/5 space-y-10">
              <div className="space-y-4">
                 <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Active Node</div>
                 <div className="text-sm font-bold text-white font-orbitron tracking-widest uppercase">Central - IN</div>
              </div>
              <div className="space-y-4">
                 <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Security Level</div>
                 <div className="text-sm font-bold text-white font-orbitron tracking-widest uppercase flex items-center gap-2">
                   <Zap className="w-3.5 h-3.5" /> High-Density
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Initialization Date</div>
                 <div className="text-sm font-mono text-white tracking-widest uppercase">
                   {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                 </div>
              </div>
              <div className="pt-8 border-t border-white/10">
                 <button 
                  onClick={() => router.push('/leaderboard')}
                  className="w-full py-4 border border-white/40 text-[10px] font-black font-orbitron text-white tracking-[0.4em] hover:bg-white hover:text-black transition-all uppercase"
                 >
                   Global Standing
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ProfileStat = ({ label, value }: { label: string, value: string | number }) => (
  <div className="text-center group cursor-default">
    <div className="text-[10px] font-black text-neutral-600 font-mono uppercase tracking-[0.4em] mb-4 group-hover:text-white transition-colors">
      {label}
    </div>
    <div className="text-5xl font-black font-orbitron text-white tracking-tighter group-hover:scale-110 transition-transform">
      {value}
    </div>
  </div>
);
