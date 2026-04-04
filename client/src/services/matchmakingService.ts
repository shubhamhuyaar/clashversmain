import { supabase } from '@/lib/supabase';

// Mock service for matchmaking queue logic
// In a real app, this would involve a queue table and a background worker

export const joinMatchQueue = async (userId: string) => {
  // In a real app, UPSERT into 'queue' table
  // Here we just simulate a success
  return { status: 'QUEUED', matchId: null };
};

export const leaveMatchQueue = async (userId: string) => {
  // DELETE from 'queue' table
  return { status: 'LEFT' };
};

export const subscribeToNewMatch = (userId: string, onMatchFound: (match: any) => void) => {
  // Listen to 'matches' table for where player1_id or player2_id = userId
  return supabase
    .channel(`match_found_${userId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'matches',
      filter: `player1_id=eq.${userId}`
    }, (payload) => onMatchFound(payload.new))
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'matches',
      filter: `player2_id=eq.${userId}`
    }, (payload) => onMatchFound(payload.new))
    .subscribe();
};

export const subscribeToMatch = (matchId: string, onUpdate: (match: any) => void) => {
  return supabase
    .channel(`match_update_${matchId}`)
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'matches',
      filter: `id=eq.${matchId}`
    }, (payload) => onUpdate(payload.new))
    .subscribe();
};

export const checkOpenMatch = async (userId: string) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq('status', 'in_progress')
    .maybeSingle();
  
  return data;
};
