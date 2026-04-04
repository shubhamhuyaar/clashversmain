'use client';

import { useEffect, useState } from 'react';
import './globals.css';
import { Inter, Orbitron, Space_Grotesk, Fira_Code } from 'next/font/google';
import { Navbar } from '../components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code', weight: ['400', '500'] });

function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cursor = document.getElementById('custom-cursor');
    const moveCursor = (e: MouseEvent) => {
      if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      }
    };

    const handleMouseDown = () => cursor?.classList.add('cursor-active');
    const handleMouseUp = () => cursor?.classList.remove('cursor-active');
    
    const interactiveElements = 'button, a, input, textarea, [role="button"], select';
    const handleMouseOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(interactiveElements)) {
        cursor?.classList.add('cursor-active');
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(interactiveElements)) {
        cursor?.classList.remove('cursor-active');
      }
    };

    document.addEventListener('mousemove', moveCursor);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <div className={`${inter.variable} ${orbitron.variable} ${grotesk.variable} ${firaCode.variable} font-grotesk antialiased selection:bg-white selection:text-black`}>
      {/* Global Background */}
      <div className="cyber-grid-container">
        <div className="cyber-grid"></div>
      </div>
      
      {/* Custom Inverted Cursor */}
      <div id="custom-cursor" className="custom-cursor hidden md:block"></div>

      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 relative z-10">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full py-12 border-t border-white/5 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-md z-10">
      <div className="text-[9px] font-black text-neutral-600 font-mono tracking-[0.6em] uppercase">
        Terminal Access Secured
      </div>
      <div className="text-[10px] font-black font-orbitron text-white tracking-[0.4em] uppercase">
        Developed by <span className="text-white opacity-100 px-2 border-x border-white/20 mx-1">P R∆THM E-5H</span>
      </div>
      <div className="text-[8px] font-mono text-neutral-800 mt-3 uppercase tracking-wider">
        © {new Date().getFullYear()} CLASHVERS MONOLITH. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
