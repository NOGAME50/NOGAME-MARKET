import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, LockKeyhole, UserRound, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import Brand from '../components/Brand';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';
import type { UserRole } from '../types';

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
