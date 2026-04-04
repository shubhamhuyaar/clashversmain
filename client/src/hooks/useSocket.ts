'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { RoomJoinedPayload, MatchStartPayload, OpponentCodeLengthPayload, RevealPayload, ChatMessage, Problem, Player, GameStatus, BattleResult } from '@/types/game';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export interface GameState {
  status: GameStatus;
  roomId: string | null;
  matchId: string | null;
  problem: Problem | null;
  myUserId: string | null;
  myUsername: string | null;
  players: Player[];
  opponentCodeLength: number;
  opponentProgress: number; 
  myProgress: number;       
  revealData: RevealPayload | null;
  eloDeltas?: Record<string, number>;
  chatMessages: ChatMessage[];
  errorMessage: string | null;
  isRateLimited: boolean;
  matchDuration: number;
  matchStartedAt: number | null;
  drawPending: boolean;
  drawRequesterName: string | null;
  finishPending: boolean;
  finishRequesterName: string | null;
  aiEvaluating: boolean;
  drawAttempts: number;
  myLanguage: string;
  myResult: BattleResult | null;
  opponentResult: BattleResult | null;
}

const initialState: GameState = {
  status: 'idle', roomId: null, matchId: null, problem: null,
  myUserId: null, myUsername: null, players: [], opponentCodeLength: 0,
  opponentProgress: 0, myProgress: 0,
  revealData: null, eloDeltas: undefined, chatMessages: [], errorMessage: null, isRateLimited: false,
  matchDuration: 15 * 60 * 1000, matchStartedAt: null,
  drawPending: false, drawRequesterName: null, 
  finishPending: false, finishRequesterName: null,
  aiEvaluating: false,
  drawAttempts: 0,
  myLanguage: 'python',
  myResult: null,
  opponentResult: null,
};

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState>(initialState);

  const update = useCallback((partial: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    // Handshake configuration
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true, 
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000, 
      reconnectionDelayMax: 5000,
      withCredentials: true // match backend CORS
    });
    socketRef.current = socket;

    socket.on('connect', () => {
        setConnected(true);
        console.log("[socket] Connected to Monolith Node");
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('room_joined', (p: RoomJoinedPayload) => {
      update({ 
        status: p.status === 'active' ? 'active' : 'waiting', 
        roomId: p.roomId, 
        matchId: p.matchId, 
        problem: p.problem, 
        players: p.players, 
        errorMessage: null 
      });
    });

    socket.on('match_start', (p: MatchStartPayload & { duration: number; startedAt: number }) => {
      update({ 
        status: 'active', 
        problem: p.problem, 
        players: p.players, 
        matchDuration: p.duration, 
        matchStartedAt: p.startedAt 
      });
    });

    socket.on('opponent_code_length', (p: OpponentCodeLengthPayload) => {
      update({ opponentCodeLength: p.codeLength });
      setGameState(prev => ({ ...prev, players: prev.players.map(pl => pl.userId === p.userId ? { ...pl, codeLength: p.codeLength, language: p.language } : pl) }));
    });

    socket.on('progress_updated', ({ userId, progress }: { userId: string; progress: number }) => {
      update({ opponentProgress: progress });
    });

    socket.on('match_end_timer', () => {
      update({ status: 'completed', aiEvaluating: true });
    });

    socket.on('reveal', (p: RevealPayload) => update({ status: 'revealed', revealData: p, eloDeltas: p.eloDeltas, aiEvaluating: false }));

    socket.on('chat_message', (msg: ChatMessage) => {
      setGameState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, msg] }));
    });

    socket.on('opponent_disconnected', ({ message }: { username: string; message: string }) => {
      update({ errorMessage: message });
    });

    socket.on('error_msg', ({ message }: { message: string }) => update({ errorMessage: message }));

    socket.on('rate_limited', () => {
      update({ isRateLimited: true });
      setTimeout(() => update({ isRateLimited: false }), 1000);
    });

    // Draw events
    socket.on('draw_requested', ({ username }: { userId: string; username: string }) => {
      update({ drawPending: true, drawRequesterName: username });
    });

    socket.on('draw_rejected', ({ username }: { username: string }) => {
      update({ drawPending: false, drawRequesterName: null, errorMessage: `${username} rejected the draw.` });
    });

    socket.on('draw_expired', () => {
      update({ drawPending: false, drawRequesterName: null, errorMessage: 'Draw request expired.' });
    });

    socket.on('draw_error', ({ message }: { message: string }) => {
      update({ drawPending: false, errorMessage: message });
    });

    // Finish events
    socket.on('finish_requested', ({ username }: { userId: string; username: string }) => {
      update({ finishPending: true, finishRequesterName: username });
    });

    socket.on('finish_rejected', ({ username }: { username: string }) => {
      update({ finishPending: false, finishRequesterName: null, errorMessage: `${username} wants to keep coding.` });
    });

    socket.on('finish_expired', () => {
      update({ finishPending: false, finishRequesterName: null, errorMessage: 'Early finish request expired.' });
    });

    // AI evaluation
    socket.on('ai_evaluating', () => update({ aiEvaluating: true }));

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [update]);

  const joinRoom = useCallback((roomId: string, userId: string, username: string, language = 'javascript') => {
    if (!socketRef.current?.connected) return;
    update({ myUserId: userId, myUsername: username, myLanguage: language });
    socketRef.current.emit('join_room', { roomId, userId, username, language });
  }, [update]);

  const sendCodeUpdate = useCallback((code: string, language: string) => {
    socketRef.current?.emit('code_update', { code, language });
  }, []);

  const sendProgressUpdate = useCallback((roomId: string, userId: string, progress: number) => {
    update({ myProgress: progress });
    socketRef.current?.emit('update_progress', { roomId, userId, progress });
  }, [update]);

  const requestDraw = useCallback(() => {
    setGameState(prev => {
      if (prev.drawAttempts >= 3) return prev;
      socketRef.current?.emit('request_draw');
      return { ...prev, drawPending: true, drawAttempts: prev.drawAttempts + 1 };
    });
  }, []);
  const confirmDraw = useCallback(() => socketRef.current?.emit('confirm_draw'), []);
  const rejectDraw = useCallback(() => socketRef.current?.emit('reject_draw'), []);

  const requestFinish = useCallback(() => {
    setGameState(prev => {
      socketRef.current?.emit('request_finish');
      return { ...prev, finishPending: true };
    });
  }, []);
  const confirmFinish = useCallback(() => socketRef.current?.emit('confirm_finish'), []);
  const rejectFinish = useCallback(() => socketRef.current?.emit('reject_finish'), []);

  const sendChat = useCallback((message: string) => {
    socketRef.current?.emit('chat_message', { message });
  }, []);

  const resetGame = useCallback(() => setGameState(initialState), []);

  return { connected, gameState, joinRoom, sendCodeUpdate, sendProgressUpdate, requestDraw, confirmDraw, rejectDraw, requestFinish, confirmFinish, rejectFinish, sendChat, resetGame, update };
}
