import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Home, Store, ShoppingBag, UserRound, LogIn, LogOut,
  Menu, X, ShieldCheck, Bell, Flag
} from 'lucide-react';
import { useState } from 'react';
import Brand from './Brand';
import { useAuth } from '../state/AuthContext';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const logout = async () => {
    await supabase?.auth.signOut();
    navigate('/');
    close();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <div className="header-actions">
          <Link to="/parametres" className="header-icon notification-button" aria-label="Notifications">
            <Bell />
          </Link>
          <button className="mobile-menu header-icon" onClick={() => setOpen(!open)} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
        <nav className={`main-nav ${open ? 'nav-open' : ''}`}>
          <NavLink to="/" onClick={close}><Home /><span>Accueil</span></NavLink>
          <NavLink to="/boutiques" onClick={close}><Store /><span>Boutiques</span></NavLink>
          <NavLink to="/vendeur" onClick={close}><ShoppingBag /><span>Vendre</span></NavLink>
          {profile?.role === 'admin' && <NavLink to="/administration" onClick={close}><ShieldCheck /><span>Administration</span></NavLink>}
          <NavLink to="/signaler" onClick={close}><Flag /><span>Signaler</span></NavLink>
          {user ? (
            <>
              <Link to="/compte" onClick={close} className="account-pill"><UserRound /><span>{profile?.full_name || 'Mon compte'}</span></Link>
              <button className="nav-action" onClick={logout}><LogOut /><span>Déconnexion</span></button>
            </>
          ) : (
            <Link to="/connexion" onClick={close}><LogIn /><span>Connexion</span></Link>
          )}
        </nav>
      </header>

      <main><Outlet /></main>

      <footer className="footer">
        <Brand compact />
        <span>La marketplace haïtienne gratuite.</span>
        <span>© {new Date().getFullYear()} NOGAME MARKET</span>
      </footer>

      <nav className="mobile-bottom" aria-label="Navigation principale">
        <NavLink to="/" end><Home /><span>Accueil</span></NavLink>
        <NavLink to="/boutiques"><Store /><span>Boutiques</span></NavLink>
        <NavLink to="/vendeur"><ShoppingBag /><span>Vendre</span></NavLink>
        <NavLink to={user ? '/compte' : '/connexion'}><UserRound /><span>Compte</span></NavLink>
      </nav>
    </div>
  );
}
