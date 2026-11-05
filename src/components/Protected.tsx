import { Link, Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../state/AuthContext';
import type { UserRole } from '../types';

type ProtectedProps = {
  children: React.ReactNode;
  roles?: UserRole[];
};

export default function Protected({
  children,
  roles
}: ProtectedProps) {
  const {
    user,
    profile,
    loading,
    profileError,
    refreshProfile
  } = useAuth();

  const location = useLocation();

  // Chargement de la session
  if (loading) {
    return (
      <div className="page-loading">
        Chargement sécurisé…
      </div>
    );
  }

  // Utilisateur non connecté
  if (!user) {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Profil introuvable ou inaccessible
  if (!profile) {
    return (
      <div className="section narrow">
        <h2>Profil indisponible</h2>

        <p>
          {profileError ||
            'Impossible de récupérer ton profil.'}
        </p>

        <button
          type="button"
          onClick={() => void refreshProfile()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Compte suspendu
  if (profile.account_status === 'suspended') {
    return (
      <div className="section narrow">
        <h2>Compte suspendu</h2>

        <p>
          Contacte l'assistance pour demander un réexamen.
        </p>
      </div>
    );
  }

  // Vérification des rôles
  if (roles && !roles.includes(profile.role)) {
    const sellerArea = roles.includes('merchant');
    return (
      <div className="section narrow">
        <h2>Accès réservé</h2>

        <p>
          {sellerArea
            ? 'Cet espace est réservé aux vendeurs et aux grossistes. Change ton type de compte pour vendre sur NOGAME MARKET.'
            : 'Cette page est réservée aux administrateurs.'}
        </p>

        <div className="action-row">
          {sellerArea && (
            <Link to="/compte" className="btn btn-orange">
              Changer mon type de compte
            </Link>
          )}
          <Link to="/" className="btn btn-light">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
