import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import {
  UserRound,
  Store,
  Flag,
  Settings
} from 'lucide-react';

export default function Account() {
  const { user, profile } = useAuth();

  return (
    <div className="section narrow">
      <span className="eyebrow">MON ESPACE</span>

      <h1>Mon compte</h1>

      <div className="profile-card">
        <UserRound />

        <h2>{profile?.full_name || 'Utilisateur'}</h2>

        <p>{user?.email}</p>

        <span className="badge">
          {profile?.role || 'buyer'}
        </span>

        <small>Compte utilisateur</small>
      </div>

      <div className="quick-grid">
        <Link to="/vendeur">
          <Store />
          Espace commercial
        </Link>

        <Link to="/signaler">
          <Flag />
          Mes signalements
        </Link>

        <Link to="/parametres">
          <Settings />
          Paramètres
        </Link>
      </div>
    </div>
  );
}
