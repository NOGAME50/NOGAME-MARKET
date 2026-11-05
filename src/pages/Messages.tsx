import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Store } from 'lucide-react';
import {
  MESSAGES_CHANGED,
  errorText,
  fetchConversations,
  formatChatTime,
  otherPartyName,
  type ConversationRow
} from '../lib/messaging';

export default function Messages() {
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const data = await fetchConversations();
        if (alive) {
          setRows(data);
          setError(null);
        }
      } catch (err) {
        if (alive) setError(errorText(err, 'Chargement impossible.'));
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    window.addEventListener(MESSAGES_CHANGED, load);
    return () => {
      alive = false;
      window.removeEventListener(MESSAGES_CHANGED, load);
    };
  }, []);

  return (
    <div className="section narrow">
      <span className="eyebrow">NOGAME MARKET</span>
      <h1>Messages</h1>

      {loading && <p className="muted">Chargement…</p>}
      {error && <div className="notice">{error}</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="empty-state">
          <MessageCircle />
          <p>Aucune conversation pour le moment. Ouvre une boutique ou un produit et touche « Contacter le vendeur ».</p>
        </div>
      )}

      <div className="msg-list">
        {rows.map(row => (
          <Link key={row.conversation_id} to={`/messages/${row.conversation_id}`} className="msg-item">
            {!row.i_am_seller && row.shop_logo_url ? (
              <img className="msg-avatar" src={row.shop_logo_url} alt="" />
            ) : (
              <span className="msg-avatar msg-avatar-fallback">
                {row.i_am_seller ? otherPartyName(row).charAt(0).toUpperCase() : <Store size={20} />}
              </span>
            )}
            <span className="msg-main">
              <b>{otherPartyName(row)}</b>
              <small>{row.i_am_seller ? `Pour ${row.shop_name}` : 'Boutique'}</small>
              <span className="msg-preview">{row.last_body ?? 'Aucun message'}</span>
            </span>
            <span className="msg-meta">
              <small>{formatChatTime(row.last_at)}</small>
              {row.unread_count > 0 && (
                <span className="msg-unread">{row.unread_count > 99 ? '99+' : row.unread_count}</span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
