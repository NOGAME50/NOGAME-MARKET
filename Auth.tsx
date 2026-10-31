import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LockKeyhole, Mail, UserRound, Phone, ArrowRight } from "lucide-react";
import Brand from "../components/Brand";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import type { UserRole } from "../types";

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const [params] = useSearchParams();
  const role = (params.get("role") === "merchant" ? "merchant" : "buyer") as UserRole;
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const navigate = useNavigate(); const { refreshProfile } = useAuth();
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMessage("");
    if (!supabase) { setMessage("Supabase n’est pas configuré. Complète le fichier .env."); return; }
    setBusy(true);
    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, requested_role: role, phone } } });
      if (error) setMessage(error.message);
      else if (data.session) { await refreshProfile(); navigate("/compte"); }
      else setMessage("Compte créé. Vérifie ton courriel pour confirmer l’adresse avant de te connecter.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message); else { await refreshProfile(); navigate("/compte"); }
    }
    setBusy(false);
  };
  return <div className="auth-wrap"><div className="auth-card"><Brand/><span className="eyebrow">{mode === "login" ? "BON RETOUR" : "REJOINDRE LA MARKETPLACE"}</span><h1>{mode === "login" ? "Connexion" : "Créer un compte"}</h1><p>{mode === "login" ? "Accède à ton espace NOGAME MARKET." : "Inscris-toi pour acheter ou vendre en Haïti."}</p>
    <form onSubmit={submit} className="form-stack">
      {mode === "register" && <><label>Nom complet<div className="input-wrap"><UserRound/><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ton nom complet"/></div></label><label>Téléphone<div className="input-wrap"><Phone/><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+509…"/></div></label><label>Type de compte<select value={role} onChange={()=>{}} disabled><option value="buyer">Acheteur</option><option value="merchant">Vendeur</option></select></label></>}
      <label>Adresse e-mail<div className="input-wrap"><Mail/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nom@exemple.com"/></div></label>
      <label>Mot de passe<div className="input-wrap"><LockKeyhole/><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="8 caractères minimum"/></div></label>
      {message && <div className="notice notice-error">{message}</div>}
      <button className="btn btn-primary btn-full" disabled={busy}>{busy ? "Patiente…" : mode === "login" ? "Se connecter" : "Créer mon compte"} <ArrowRight/></button>
    </form>
    <div className="auth-switch">{mode === "login" ? <>Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></> : <>Tu as déjà un compte ? <Link to="/connexion">Se connecter</Link></>}</div>
    <small>La création de compte ne donne jamais automatiquement les droits administrateur. Les rôles privilégiés sont attribués côté serveur.</small>
  </div></div>;
}