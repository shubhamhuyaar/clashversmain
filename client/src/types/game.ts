export interface Player {
  userId: string;
  username: string;
  language: string;
  codeLength?: number;
  elo?: number;
  rating?: number;
  progress?: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  constraints: string[];
  testCases: TestCase[];
  starterCode: {
    [key: string]: string;
  };
}

export interface RevealedPlayer {
  userId: string;
  username: string;
  code: string;
  language: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  matchId: string;
  problem: Problem;
  status: 'waiting' | 'active' | 'completed';
  players: Player[];
}

export interface MatchStartPayload {
  players: Player[];
  problem: Problem;
}

export interface OpponentCodeLengthPayload {
  userId: string;
  codeLength: number;
  language: string;
}

export interface RevealPayload {
  winner: 'player1' | 'player2' | 'draw';
  explanation: string;
  evaluations?: {
    [userId: string]: { feedback: string; improvements: string };
  };
  eloDeltas?: Record<string, number>;
  players: RevealedPlayer[];
}

export interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

export type GameStatus = 'idle' | 'waiting' | 'active' | 'completed' | 'revealed';

export enum BattleStatus {
  IDLE = 'idle',
  SEARCHING = 'searching',
  MATCHED = 'matched',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished'
}

export interface BattleResult {
  passed: number;
  total: number;
  executionTime: number;
  normalizedExecutionTime: number;
  completionTime: number;
  normalizedCompletionTime: number;
  complexity: string;
  complexityScore: number;
  code: string;
  accuracy: number;
  precision: number;
  recall: number;
}
