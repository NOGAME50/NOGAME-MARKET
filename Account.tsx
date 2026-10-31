import { Link } from "react-router-dom";
import { UserRound, Store, ShieldCheck, Settings, LogOut, Package, CircleHelp } from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { supabase } from "../lib/supabase";
export default function Account() {
  const { user, profile } = useAuth();
  return <div className="section narrow"><span className="eyebrow">ESPACE PERSONNEL</span><h1>Mon compte</h1><div className="profile-card"><div className="avatar"><UserRound/></div><div><b>{profile?.full_name || user?.email || "Utilisateur"}</b><span>{user?.email}</span><small>Rôle : {profile?.role || "profil en attente"}</small></div></div>
    <div className="account-links">
      <Link to="/vendeur"><Store/>Espace vendeur</Link><Link to="/commandes"><Package/>Mes commandes</Link><Link to="/assistance"><CircleHelp/>Centre d’assistance</Link><Link to="/parametres"><Settings/>Paramètres et confidentialité</Link>
      {profile?.role === "admin" && <Link to="/administration"><ShieldCheck/>Administration</Link>}
      <button onClick={() => void supabase?.auth.signOut()}><LogOut/>Déconnexion</button>
    </div>
  </div>;
}