import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, Store, Flag, Settings, Trash2 } from 'lucide-react';
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

async function removeMyImages(userId: string) {
  if (!supabase) return;
  try {
    const bucket = supabase.storage.from('product-images');
    const { data } = await bucket.list(userId, { limit: 1000 });
    const paths = (data ?? []).map(file => `${userId}/${file.name}`);
    if (paths.length > 0) await bucket.remove(paths);
  } catch {
    // Nettoyage des photos : si les règles de stockage l'interdisent, la suppression du compte continue.
  }
}

export default function Account() {
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
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

  const deleteAccount = async () => {
    if (!supabase || !user || busy || confirmText.trim().toUpperCase() !== 'SUPPRIMER') return;
    setBusy(true);
    setDeleteError('');
    try {
      await removeMyImages(user.id);
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      await supabase.auth.signOut({ scope: 'local' });
      window.location.assign('/');
    } catch (err) {
      const text =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : '';
      setDeleteError(text || 'Suppression impossible pour le moment.');
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

      <p style={{ marginTop: 18 }}>
        <small>
          <Link to="/confidentialite">Politique de confidentialité</Link>
        </small>
      </p>

      {role !== 'admin' && (
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #dfe6f1', display: 'grid', gap: 10 }}>
          <b style={{ color: '#b42318' }}>Supprimer mon compte</b>
          {!confirming ? (
            <button type="button" className="btn btn-light" onClick={() => setConfirming(true)}>
              <Trash2 />
              Supprimer mon compte
            </button>
          ) : (
            <>
              <p style={{ margin: 0 }}>
                Cette action est définitive : ton profil, tes boutiques, tes produits, tes messages et tes
                favoris seront supprimés. Écris <b>SUPPRIMER</b> pour confirmer.
              </p>
              <input
                value={confirmText}
                onChange={ev => setConfirmText(ev.target.value)}
                placeholder="SUPPRIMER"
                autoCapitalize="characters"
                aria-label="Confirmation de suppression"
                style={{ height: 46, padding: '0 14px', border: '1px solid #d7e0ed', borderRadius: 12 }}
              />
              {deleteError && <div className="notice">{deleteError}</div>}
              <div className="action-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || confirmText.trim().toUpperCase() !== 'SUPPRIMER'}
                  onClick={() => void deleteAccount()}
                  style={{ background: '#b42318' }}
                >
                  <Trash2 />
                  {busy ? 'Suppression…' : 'Supprimer définitivement'}
                </button>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={busy}
                  onClick={() => {
                    setConfirming(false);
                    setConfirmText('');
                    setDeleteError('');
                  }}
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
