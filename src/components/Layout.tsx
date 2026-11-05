import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { Home, Store, ShoppingBag, UserRound, LogIn, LogOut, Menu, X, ShieldCheck, Bell, Flag } from 'lucide-react';
import { useState } from 'react';
import Brand from './Brand';
import { useAuth } from '../state/AuthContext';
import { supabase } from '../lib/supabase';
import { useUnreadCount } from '../lib/messaging';
import { usePendingRole } from '../lib/pendingRole';

export default function Layout() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  // Nombre réel de messages non lus (0 si déconnecté).
  const unreadMessageCount = useUnreadCount();
  usePendingRole();
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
          <Link to={user ? '/messages' : '/connexion'} className="header-icon notification-button" aria-label={unreadMessageCount > 0 ? `${unreadMessageCount} messages non lus` : 'Messages'}>
            <Bell aria-hidden="true" />
            {unreadMessageCount > 0 && <span className="message-count">{unreadMessageCount > 99 ? '99+' : unreadMessageCount}</span>}
          </Link>
          <button className="mobile-menu header-icon" onClick={() => setOpen(!open)} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
        <nav className={`main-nav ${open ? 'nav-open' : ''}`} aria-label="Navigation secondaire">
          <NavLink to="/" end onClick={close}><Home /><span>Accueil</span></NavLink>
          <NavLink to="/boutiques" onClick={close}><Store /><span>Boutiques</span></NavLink>
          <NavLink to="/vendeur" onClick={close}><ShoppingBag /><span>Vendre</span></NavLink>
          {profile?.role === 'admin' && <NavLink to="/administration" onClick={close}><ShieldCheck /><span>Administration</span></NavLink>}
          <NavLink to="/signaler" onClick={close}><Flag /><span>Signaler</span></NavLink>
          {user ? (
            <>
              <Link to="/compte" onClick={close} className="account-pill"><UserRound /><span>{profile?.full_name || 'Mon compte'}</span></Link>
              <button className="nav-action" onClick={logout}><LogOut /><span>Déconnexion</span></button>
            </>
          ) : <Link to="/connexion" onClick={close}><LogIn /><span>Connexion</span></Link>}
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
