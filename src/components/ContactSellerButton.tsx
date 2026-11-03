import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';

type Props = {
  shopId: string;
  ownerId?: string;
  prefill?: string;
};

export default function ContactSellerButton({ shopId, ownerId, prefill }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (ownerId && user?.id === ownerId) return null;

  const open = async () => {
    setError(null);
    if (!user) {
      navigate('/connexion', { state: { from: location.pathname } });
      return;
    }
    if (!supabase) {
      setError('Connexion à Supabase indisponible.');
      return;
    }
    setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('start_conversation', { p_shop: shopId });
      if (rpcError) throw rpcError;
      navigate(`/messages/${data as string}`, { state: { draft: prefill ?? '' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’ouvrir la conversation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="btn btn-orange" onClick={() => void open()} disabled={busy}>
        <MessageSquare />
        {busy ? 'Ouverture…' : 'Contacter le vendeur'}
      </button>
      {error && <div className="notice">{error}</div>}
    </>
  );
}
