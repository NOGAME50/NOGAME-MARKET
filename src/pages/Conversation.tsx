import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Flag, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';
import {
  errorText,
  fetchConversations,
  formatChatTime,
  notifyMessagesChanged,
  otherPartyName,
  type ConversationRow,
  type Message
} from '../lib/messaging';

const MESSAGE_COLUMNS = 'id,conversation_id,sender_id,body,created_at';

export default function Conversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const uid = user?.id ?? null;

  const [head, setHead] = useState<ConversationRow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState((location.state as { draft?: string } | null)?.draft ?? '');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const markRead = useCallback(async () => {
    if (!supabase || !id) return;
    await supabase.rpc('mark_conversation_read', { p_conv: id });
    notifyMessagesChanged();
  }, [id]);

  useEffect(() => {
    if (!supabase || !id) {
      setLoading(false);
      return;
    }
    const client = supabase;
    let alive = true;

    const load = async () => {
      try {
        const [rows, result] = await Promise.all([
          fetchConversations(),
          client
            .from('messages')
            .select(MESSAGE_COLUMNS)
            .eq('conversation_id', id)
            .order('created_at', { ascending: true })
            .limit(300)
        ]);
        if (result.error) throw result.error;
        if (!alive) return;
        setHead(rows.find(row => row.conversation_id === id) ?? null);
        setMessages((result.data ?? []) as Message[]);
        void markRead();
      } catch (err) {
        if (alive) setError(errorText(err, 'Chargement impossible.'));
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();

    const channel = client
      .channel(`chat-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        payload => {
          const incoming = payload.new as Message;
          setMessages(prev => (prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming]));
          if (incoming.sender_id !== uid) void markRead();
        }
      )
      .subscribe();

    return () => {
      alive = false;
      void client.removeChannel(channel);
    };
  }, [id, uid, markRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!supabase || !id || !uid || !body || sending) return;
    setSending(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({ conversation_id: id, sender_id: uid, body })
        .select(MESSAGE_COLUMNS)
        .single();
      if (insertError) throw insertError;
      const sent = data as Message;
      setMessages(prev => (prev.some(m => m.id === sent.id) ? prev : [...prev, sent]));
      setText('');
      notifyMessagesChanged();
    } catch (err) {
      setError(errorText(err, 'Envoi impossible.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="section">Chargement…</div>;

  if (!head) {
    return (
      <div className="section narrow">
        <div className="empty-state">Conversation introuvable.</div>
        <Link to="/messages" className="btn btn-light"><ArrowLeft /> Retour aux messages</Link>
      </div>
    );
  }

  const reportHref = head.i_am_seller
    ? `/signaler?type=user&id=${head.buyer_id}`
    : `/signaler?type=shop&id=${head.shop_id}`;

  return (
    <div className="chat-page">
      <header className="chat-head">
        <Link to="/messages" className="icon-button" aria-label="Retour aux messages"><ArrowLeft /></Link>
        <div className="chat-title">
          <b>{otherPartyName(head)}</b>
          <small>{head.i_am_seller ? `Pour ${head.shop_name}` : 'Boutique'}</small>
        </div>
        <Link to={reportHref} className="icon-button danger" aria-label="Signaler"><Flag /></Link>
      </header>

      <div className="chat-body">
        {messages.length === 0 && <p className="muted chat-empty">Écris le premier message.</p>}
        {messages.map(m => (
          <div key={m.id} className={`bubble ${m.sender_id === uid ? 'bubble-me' : 'bubble-them'}`}>
            <span>{m.body}</span>
            <small>{formatChatTime(m.created_at)}</small>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <div className="notice chat-error">{error}</div>}

      <form className="chat-form" onSubmit={e => void send(e)}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Écris ton message…"
          maxLength={2000}
          aria-label="Message"
        />
        <button className="btn btn-primary" disabled={sending || !text.trim()} aria-label="Envoyer">
          <Send />
        </button>
      </form>
    </div>
  );
}
