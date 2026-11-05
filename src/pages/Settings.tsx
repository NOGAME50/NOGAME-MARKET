import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, LogOut, Settings as SettingsIcon, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';

const card: CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 16,
  marginTop: 16,
  background: '#fff',
  border: '1px solid #dfe6f1',
  borderRadius: 16
};

function messageOf(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const value = (err as { message?: unknown }).message;
    if (typeof value === 'string' && value) return value;
  }
  return fallback;
}

function PasswordInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <div className="input-wrap">
        <LockKeyhole />
        <input
          required
          minLength={8}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={ev => onChange(ev.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          style={{ background: 'none', border: 0, padding: 0, display: 'grid', placeItems: 'center', flex: 'none' }}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>
    </label>
  );
}

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(profile?.full_name ?? '');
  const [nameMessage, setNameMessage] = useState('');
  const [nameBusy, setNameBusy] = useState(false);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  // Les comptes créés avec Google n'ont pas de mot de passe sur NOGAME MARKET.
  const providers = (user?.app_metadata?.providers as string[] | undefined) ?? [];
  const hasPassword = providers.includes('email');

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    setNameMessage('');
    if (!supabase || !user) return;
    if (clean.length < 2 || clean.length > 80) {
      setNameMessage('Le nom doit contenir entre 2 et 80 caractères.');
      return;
    }
    setNameBusy(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: clean }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      setNameMessage('Nom enregistré.');
    } catch (err) {
      setNameMessage(messageOf(err, 'Enregistrement impossible.'));
    } finally {
      setNameBusy(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    if (!supabase) return;
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setPasswordMessage('Le mot de passe doit avoir au moins 8 caractères, avec une lettre et un chiffre.');
      return;
    }
    if (password !== confirm) {
      setPasswordMessage('Les deux mots de passe ne sont pas identiques.');
      return;
    }
    setPasswordBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirm('');
      setPasswordMessage('Mot de passe modifié.');
    } catch (err) {
      setPasswordMessage(messageOf(err, 'Modification impossible. Reconnecte-toi puis réessaie.'));
    } finally {
      setPasswordBusy(false);
    }
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="section narrow">
      <div className="placeholder-icon">
        <SettingsIcon />
      </div>
      <span className="eyebrow">NOGAME MARKET</span>
      <h1>Paramètres</h1>

      <div style={card}>
        <b>
          <UserRound size={18} style={{ verticalAlign: 'text-bottom' }} /> Mon profil
        </b>
        <small style={{ color: '#6b7a90' }}>{user?.email}</small>
        <form className="form-stack" onSubmit={saveName}>
          <label>
            Nom complet
            <div className="input-wrap">
              <UserRound />
              <input required value={name} onChange={ev => setName(ev.target.value)} maxLength={80} />
            </div>
          </label>
          {nameMessage && <div className="notice">{nameMessage}</div>}
          <button className="btn btn-primary" disabled={nameBusy}>
            {nameBusy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>

      <div style={card}>
        <b>
          <LockKeyhole size={18} style={{ verticalAlign: 'text-bottom' }} /> Mot de passe
        </b>
        {hasPassword ? (
          <form className="form-stack" onSubmit={savePassword}>
            <PasswordInput label="Nouveau mot de passe" value={password} onChange={setPassword} />
            <PasswordInput label="Confirmer le mot de passe" value={confirm} onChange={setConfirm} />
            <small style={{ color: '#6b7a90' }}>8 caractères minimum, avec au moins une lettre et un chiffre.</small>
            {passwordMessage && <div className="notice">{passwordMessage}</div>}
            <button className="btn btn-primary" disabled={passwordBusy}>
              {passwordBusy ? 'Modification…' : 'Changer le mot de passe'}
            </button>
          </form>
        ) : (
          <small style={{ color: '#6b7a90' }}>
            Ton compte utilise la connexion Google : il n’y a pas de mot de passe NOGAME MARKET à modifier.
          </small>
        )}
      </div>

      <div style={card}>
        <b>Compte et confidentialité</b>
        <Link to="/compte" className="btn btn-light">
          Changer mon type de compte
        </Link>
        <Link to="/confidentialite" className="btn btn-light">
          Politique de confidentialité
        </Link>
        <Link to="/suppression-compte" className="btn btn-light">
          Supprimer mon compte
        </Link>
      </div>

      <div style={card}>
        <button type="button" className="btn btn-light" onClick={() => void signOut()}>
          <LogOut />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
