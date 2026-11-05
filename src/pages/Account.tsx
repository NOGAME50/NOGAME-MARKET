import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, Store, Flag, Settings } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';

const ROLE_LABELS: Record<UserRole, string> = {
  buyer: 'Acheteur',
  merchant: 'Vendeur',
  wholesaler: 'Grossiste',
  admin: 'Administrateur'
};

const CHOICES: { value: UserRole; title: string; hint: string }[] = [
  { value: 'buyer', title: 'Acheteur', hint: 'J’achète des produits' },
  { value: 'merchant', title: 'Vendeur', hint: 'Je vends mes produits' },
  { value: 'wholesaler', title: 'Grossiste', hint: 'Je vends en gros' }
];

export default function Account() {
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const role: UserRole = profile?.role ?? 'buyer';

  const change = async (next: UserRole) => {
    if (!supabase || next === role || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.rpc('choose_account_type', { p_role: next });
      if (error) throw error;
      await refreshProfile();
      setMessage(
        next === 'buyer'
          ? 'Compte acheteur activé.'
          : 'Compte mis à jour. Tu peux maintenant ouvrir l’espace vendeur.'
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Changement impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="section narrow">
      <span className="eyebrow">MON ESPACE</span>

      <h1>Mon compte</h1>

      <div className="profile-card">
        <UserRound />

        <h2>{profile?.full_name || 'Utilisateur'}</h2>

        <p>{user?.email}</p>

        <span className="badge">{ROLE_LABELS[role]}</span>

        <small>Compte utilisateur</small>
      </div>

      {role !== 'admin' && (
        <div style={{ display: 'grid', gap: 8, margin: '18px 0' }}>
          <b>Type de compte</b>
          {CHOICES.map(choice => {
            const selected = role === choice.value;
            return (
              <button
                key={choice.value}
                type="button"
                disabled={busy}
                aria-pressed={selected}
                onClick={() => void change(choice.value)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  display: 'grid',
                  gap: 2,
                  color: 'inherit',
                  border: selected ? '2px solid var(--orange)' : '1px solid #d7e0ed',
                  background: selected ? '#fff6ea' : '#fff'
                }}
              >
                <b>{choice.title}</b>
                <small style={{ color: '#6b7a90' }}>{choice.hint}</small>
              </button>
            );
          })}
          {message && <div className="notice">{message}</div>}
        </div>
      )}

      <div className="quick-grid">
        {role !== 'buyer' && (
          <Link to="/vendeur">
            <Store />
            Espace commercial
          </Link>
        )}

        <Link to="/signaler">
          <Flag />
          Mes signalements
        </Link>

        <Link to="/parametres">
          <Settings />
          Paramètres
        </Link>
      </div>
    </div>
  );
}
