import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, LockKeyhole, UserRound, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import Brand from '../components/Brand';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';
import type { UserRole } from '../types';

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
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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
    setBusy(true);
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, phone, requested_role: role } }
        });
        if (error) throw error;
        if (data.session) {
          await finish();
        } else {
          setStep('code');
          setMessage(`Un code de confirmation a été envoyé à ${email}.`);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('not confirmed')) {
            await supabase.auth.resend({ type: 'signup', email });
            setStep('code');
            setMessage('Ton adresse n’est pas encore confirmée. Un nouveau code vient d’être envoyé.');
            return;
          }
          throw error;
        }
        await finish();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
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
      setMessage(err instanceof Error ? err.message : 'Code invalide ou expiré.');
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
      setMessage(err instanceof Error ? err.message : 'Envoi impossible pour le moment.');
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${target}` }
      });
      if (error) throw error;
      // Le navigateur est redirigé vers Google : rien d'autre à faire ici.
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
              <label>
                Téléphone
                <div className="input-wrap">
                  <Phone />
                  <input required value={phone} onChange={ev => setPhone(ev.target.value)} placeholder="+509…" />
                </div>
              </label>
              <label>
                Type de compte
                <select value={role} onChange={ev => setRole(ev.target.value as UserRole)}>
                  <option value="buyer">Acheteur</option>
                  <option value="merchant">Vendeur</option>
                  <option value="wholesaler">Grossiste</option>
                </select>
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
          <label>
            Mot de passe
            <div className="input-wrap">
              <LockKeyhole />
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={ev => setPassword(ev.target.value)}
              />
            </div>
          </label>
          {message && <div className="notice">{message}</div>}
          <button className="btn btn-primary btn-full" disabled={busy}>
            {busy ? 'Patiente…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            <ArrowRight />
          </button>
        </form>

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

        <p className="auth-switch">
          {mode === 'login' ? (
            <>Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></>
          ) : (
            <>Déjà inscrit ? <Link to="/connexion">Se connecter</Link></>
          )}
        </p>
        <small>
          Les comptes acheteurs, vendeurs et grossistes sont gratuits. Les droits administrateur ne peuvent pas
          être choisis ici.
        </small>
      </div>
    </div>
  );
}
