import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../state/AuthContext';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface ConversationRow {
  conversation_id: string;
  shop_id: string;
  shop_name: string;
  shop_logo_url: string | null;
  buyer_id: string;
  buyer_name: string | null;
  i_am_seller: boolean;
  last_body: string | null;
  last_at: string;
  unread_count: number;
}

// Les erreurs Supabase (PostgrestError) ne sont pas des « Error » JavaScript : on lit leur message à la main.
export function errorText(err: unknown, fallback: string): string {
  let message = '';
  if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === 'object' && err !== null && 'message' in err) {
    const value = (err as { message?: unknown }).message;
    if (typeof value === 'string') message = value;
  }
  if (!message) return fallback;
  if (message.includes('Could not find the function') || message.includes('schema cache')) {
    return 'La messagerie n’est pas encore installée sur le serveur (script messaging_v1.sql).';
  }
  return message;
}

export const MESSAGES_CHANGED = 'nm-messages-changed';

export function notifyMessagesChanged() {
  window.dispatchEvent(new Event(MESSAGES_CHANGED));
}

export async function fetchConversations(): Promise<ConversationRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('my_conversations');
  if (error) throw error;
  return ((data ?? []) as ConversationRow[]).map(row => ({
    ...row,
    unread_count: Number(row.unread_count)
  }));
}

export function otherPartyName(row: ConversationRow): string {
  return row.i_am_seller ? row.buyer_name || 'Client' : row.shop_name;
}

export function formatChatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// Compteur de messages non lus pour le badge de la cloche.
// Une seule souscription temps réel (dans Layout) alimente tout le reste via MESSAGES_CHANGED.
export function useUnreadCount(): number {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!supabase || !uid) {
      setCount(0);
      return;
    }
    const client = supabase;
    let alive = true;

    const refresh = async () => {
      const { data, error } = await client.rpc('unread_messages_count');
      if (alive && !error) setCount(Number(data ?? 0));
    };

    void refresh();
    window.addEventListener(MESSAGES_CHANGED, refresh);

    const channel = client
      .channel(`unread-${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        notifyMessagesChanged();
      })
      .subscribe();

    const timer = window.setInterval(() => void refresh(), 60000);

    return () => {
      alive = false;
      window.removeEventListener(MESSAGES_CHANGED, refresh);
      window.clearInterval(timer);
      void client.removeChannel(channel);
    };
  }, [uid]);

  return count;
}
