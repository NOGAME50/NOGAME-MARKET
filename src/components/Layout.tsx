import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { Home, Store, ShoppingBag, UserRound, LogIn, LogOut, Menu, X, Package, ShieldCheck, Bell } from "lucide-react";
import { useState } from "react";
import Brand from "./Brand";
import { useAuth } from "../state/AuthContext";
import { supabase } from "../lib/supabase";

export default function Layout() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const logout = async () => { await supabase?.auth.signOut(); navigate("/"); setOpen(false); };
  const close = () => setOpen(false);
  return <div className="app-shell">
    <header className="topbar">
      <Brand />
      <div className="topbar-actions">
        <Link to="/parametres" className="nm-icon-btn nm-bell" aria-label="Notifications"><Bell/></Link>
        <button className="mobile-menu icon-button" onClick={() => setOpen(!open)} aria-label="Ouvrir le menu">{open ? <X/> : <Menu/>}</button>
      </div>
      <nav className={`main-nav ${open ? "nav-open" : ""}`}>
        <NavLink to="/" onClick={close}><Home/>Accueil</NavLink>
        <NavLink to="/boutiques" onClick={close}><Store/>Boutiques</NavLink>
        <NavLink to="/vendeur" onClick={close}><Package/>Espace vendeur</NavLink>
        {profile?.role === "admin" && <NavLink to="/administration" onClick={close}><ShieldCheck/>Administration</NavLink>}
        {user ? <button className="nav-action" onClick={logout}><LogOut/>Déconnexion</button> : <Link to="/connexion" onClick={close}><LogIn/>Connexion</Link>}
        {user && <Link to="/compte" onClick={close} className="account-pill"><UserRound/>{profile?.full_name || "Mon compte"}</Link>}
      </nav>
    </header>
    <main><Outlet /></main>
    <footer className="footer"><Brand compact/><span>La marketplace haïtienne.</span><span>© {new Date().getFullYear()} NOGAME MARKET</span></footer>
    <div className="mobile-bottom">
      <NavLink to="/"><Home/><span>Accueil</span></NavLink>
      <NavLink to="/boutiques"><Store/><span>Boutiques</span></NavLink>
      <NavLink to="/vendeur"><ShoppingBag/><span>Vendre</span></NavLink>
      <NavLink to={user ? "/compte" : "/connexion"}><UserRound/><span>Compte</span></NavLink>
    </div>
  </div>;
}
