import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Mail, LockKeyhole, UserRound, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Brand from '../components/Brand';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';
import { forgetPendingRole, rememberPendingRole } from '../lib/pendingRole';
import type { UserRole } from '../types';

const EMAIL_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'outlok.com': 'outlook.com'
};

function checkEmail(value: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'Adresse e-mail invalide. Exemple : nom@gmail.com';
  const domain = value.split('@')[1] ?? '';
  const fix = EMAIL_TYPOS[domain];
  return fix ? `Vérifie ton adresse : voulais-tu écrire @${fix} ?` : null;
}

function checkPassword(value: string): string | null {
  if (value.length < 8) return 'Le mot de passe doit avoir au moins 8 caractères.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Le mot de passe doit contenir au moins une lettre et un chiffre.';
  }
  return null;
}

function friendlyError(text: string): string {
  const m = text.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (m.includes('already registered')) return 'Un compte existe déjà avec cet e-mail. Connecte-toi.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (m.includes('error sending')) return 'Impossible d’envoyer le code pour le moment. Réessaie plus tard.';
  if (m.includes('token has expired') || m.includes('otp')) return 'Code invalide ou expiré. Demande un nouveau code.';
  if (m.includes('password should be')) return 'Mot de passe trop faible. Utilise au moins 8 caractères avec lettres et chiffres.';
  return text;
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  minLength
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <div className="input-wrap">
        <LockKeyhole />
        <input
          required
          minLength={minLength}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
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

const ROLE_CHOICES: { value: UserRole; title: string; hint: string }[] = [
  { value: 'buyer', title: 'Acheteur', hint: 'J’achète des produits' },
  { value: 'merchant', title: 'Vendeur', hint: 'Je vends mes produits' },
  { value: 'wholesaler', title: 'Grossiste', hint: 'Je vends en gros' }
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  // La connexion Google est disponible sur le site et dans l'application Android.
  const showGoogle = true;
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const roleParam = params.get('role');
  const [role, setRole] = useState<UserRole>(
    roleParam === 'wholesaler' ? 'wholesaler' : roleParam === 'merchant' ? 'merchant' : 'buyer'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Page d'origine (ex. « Contacter le vendeur » renvoie ici avant la connexion).
  const from = (location.state as { from?: string } | null)?.from;

  const finish = async () => {
    await refreshProfile();
    navigate(from && from.startsWith('/') && !from.startsWith('//') ? from : '/compte', { replace: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Supabase non configuré. Complète .env.local.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailProblem = checkEmail(cleanEmail);
    if (emailProblem) {
      setMessage(emailProblem);
      return;
    }
    if (mode === 'register') {
      const passwordProblem = checkPassword(password);
      if (passwordProblem) {
        setMessage(passwordProblem);
        return;
      }
      if (password !== confirmPassword) {
        setMessage('Les deux mots de passe ne sont pas identiques.');
        return;
      }
    }
    setEmail(cleanEmail);
    setBusy(true);
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: name, requested_role: role } }
        });
        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setMessage('Un compte existe déjà avec cet e-mail. Connecte-toi, ou utilise « Continuer avec Google ».');
          return;
        }
        if (data.session) {
          await finish();
        } else {
          setStep('code');
          setMessage(`Un code de confirmation a été envoyé à ${cleanEmail}.`);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          if (error.message.toLowerCase().includes('not confirmed')) {
            await supabase.auth.resend({ type: 'signup', email: cleanEmail });
            setStep('code');
            setMessage('Ton adresse n’est pas encore confirmée. Un nouveau code vient d’être envoyé.');
            return;
          }
          throw error;
        }
        await finish();
      }
    } catch (err) {
      setMessage(err instanceof Error ? friendlyError(err.message) : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Supabase non configuré. Complète .env.local.');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'signup' });
      if (error) throw error;
      if (!data.session) throw new Error('Code accepté, mais aucune session ouverte. Connecte-toi.');
      await finish();
    } catch (err) {
      setMessage(err instanceof Error ? friendlyError(err.message) : 'Code invalide ou expiré.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setMessage('');
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setMessage('Un nouveau code vient d’être envoyé.');
    } catch (err) {
      setMessage(err instanceof Error ? friendlyError(err.message) : 'Envoi impossible pour le moment.');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setMessage('');
    if (!supabase) {
      setMessage('Supabase non configuré. Complète .env.local.');
      return;
    }
    setBusy(true);
    try {
      const target = from && from.startsWith('/') && !from.startsWith('//') ? from : '/compte';
      if (mode === 'register') rememberPendingRole(role);
      else forgetPendingRole();
      if (Capacitor.isNativePlatform()) {
        // Android : ouvrir OAuth dans le navigateur système, jamais dans la WebView.
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'com.nogame.market://login-callback',
            skipBrowserRedirect: true
          }
        });
        if (error) throw error;
        if (!data.url) throw new Error('Impossible de préparer la connexion Google.');
        await Browser.open({ url: data.url });
        setBusy(false);
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}${target}` }
        });
        if (error) throw error;
        // Sur le site, le navigateur poursuit normalement la redirection OAuth.
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : '';
      setMessage(
        text.toLowerCase().includes('provider')
          ? 'La connexion Google n’est pas encore activée sur le serveur.'
          : text || 'Connexion Google impossible pour le moment.'
      );
      setBusy(false);
    }
  };

  if (step === 'code') {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <Brand />
          <span className="eyebrow">SÉCURITÉ DU COMPTE</span>
          <h1>Confirme ton e-mail</h1>
          <p>Saisis le code reçu à {email}. Pense à vérifier les spams.</p>
          <form className="form-stack" onSubmit={verify}>
            <label>
              Code de confirmation
              <div className="input-wrap">
                <ShieldCheck />
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  minLength={6}
                  maxLength={10}
                  value={code}
                  onChange={ev => setCode(ev.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                />
              </div>
            </label>
            {message && <div className="notice">{message}</div>}
            <button className="btn btn-primary btn-full" disabled={busy || code.length < 6}>
              {busy ? 'Patiente…' : 'Confirmer mon compte'}
              <ArrowRight />
            </button>
          </form>
          <p className="auth-switch">
            <button type="button" className="btn btn-light" onClick={() => void resend()} disabled={busy}>
              Renvoyer le code
            </button>
          </p>
          <p className="auth-switch">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => {
                setStep('form');
                setCode('');
                setMessage('');
              }}
            >
              Changer d’adresse e-mail
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Brand />
        <span className="eyebrow">NOGAME MARKET GRATUIT</span>
        <h1>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
        <p>{mode === 'login' ? 'Accède à ton espace.' : 'Rejoins les acheteurs et commerçants haïtiens.'}</p>

        {mode === 'register' && (
          <div style={{ display: 'grid', gap: 8, margin: '6px 0 16px' }}>
            <b style={{ fontSize: 14 }}>Je m’inscris comme :</b>
            {ROLE_CHOICES.map(choice => {
              const selected = role === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setRole(choice.value)}
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
          </div>
        )}

        <form className="form-stack" onSubmit={submit}>
          {mode === 'register' && (
            <>
              <label>
                Nom complet
                <div className="input-wrap">
                  <UserRound />
                  <input required value={name} onChange={ev => setName(ev.target.value)} />
                </div>
              </label>
            </>
          )}
          <label>
            Adresse e-mail
            <div className="input-wrap">
              <Mail />
              <input required type="email" value={email} onChange={ev => setEmail(ev.target.value)} />
            </div>
          </label>
          <PasswordField
            label="Mot de passe"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'register' ? 8 : undefined}
          />
          {mode === 'register' && (
            <>
              <small style={{ color: '#6b7a90' }}>8 caractères minimum, avec au moins une lettre et un chiffre.</small>
              <PasswordField
                label="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                minLength={8}
              />
              {confirmPassword && password !== confirmPassword && (
                <small style={{ color: '#b42318' }}>Les deux mots de passe ne sont pas identiques.</small>
              )}
            </>
          )}
          {message && <div className="notice">{message}</div>}
          <button className="btn btn-primary btn-full" disabled={busy}>
            {busy ? 'Patiente…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            <ArrowRight />
          </button>
        </form>

        {showGoogle && (
          <>
            <div
              aria-hidden="true"
              style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0', color: '#6b7a90', fontSize: 12 }}
            >
              <span style={{ flex: 1, height: 1, background: '#dfe6f1' }} />
              ou
              <span style={{ flex: 1, height: 1, background: '#dfe6f1' }} />
            </div>

            <button type="button" className="btn btn-light btn-full" onClick={() => void google()} disabled={busy}>
              <GoogleIcon />
              Continuer avec Google
            </button>
          </>
        )}

        <p className="auth-switch">
          {mode === 'login' ? (
            <>Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></>
          ) : (
            <>Déjà inscrit ? <Link to="/connexion">Se connecter</Link></>
          )}
        </p>
        <small>
          Les comptes acheteurs, vendeurs et grossistes sont gratuits. Les droits administrateur ne peuvent pas
          être choisis ici. En continuant, tu acceptes notre{' '}
          <Link to="/confidentialite">politique de confidentialité</Link>.
        </small>
      </div>
    </div>
  );
}
