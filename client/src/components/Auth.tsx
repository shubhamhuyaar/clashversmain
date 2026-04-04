'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, AlertCircle, Code2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const Auth: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const serverUrl = 'http://localhost:3001';

    try {
      const response = await fetch(`${serverUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store session locally
      localStorage.setItem('clashvers_session', JSON.stringify({
        userId: data.userId,
        username: data.username,
        elo: data.elo || 1000,
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      }));

      // Trigger a storage event for the layout/navbar to pick up
      window.dispatchEvent(new Event('storage'));
      
      // Force refresh or navigation
      window.location.reload(); 
    } catch (err: any) {
      setError(err.message || 'Connection failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative">
      <div className="w-full max-w-sm glass-panel p-10 border border-white/10 text-center relative z-10">
        <div className="mb-12">
          <Code2 className="w-10 h-10 text-white mx-auto mb-6" />
          <h1 className="text-3xl font-black text-white font-orbitron tracking-widest uppercase">
            CLASH<span className="opacity-20">VERS</span>
          </h1>
          <p className="text-[9px] text-neutral-500 font-mono tracking-[0.4em] uppercase mt-2">
            {isLogin ? 'Establish Connection' : 'Register Identity'}
          </p>
        </div>

        {error && (
          <div className="border border-white/40 text-white p-3 text-[10px] font-mono mb-8 uppercase tracking-widest bg-white/5">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6 text-left">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Codename</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:border-white outline-none transition-all font-grotesk text-sm uppercase"
              placeholder="USER_ID"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Secret Key</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:border-white outline-none transition-all font-grotesk text-sm"
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-black font-orbitron text-xs py-4 tracking-[0.4em] hover:bg-neutral-300 transition-all uppercase mt-6"
          >
            {loading ? 'PROCESSING' : isLogin ? 'Authenticate' : 'Initialize'}
          </button>
        </form>

        <div className="mt-10">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-neutral-500 hover:text-white text-[9px] font-mono tracking-widest uppercase"
          >
            {isLogin ? "[ Create New Account ]" : "[ Return to Login ]"}
          </button>
        </div>
      </div>
    </div>
  );
};
