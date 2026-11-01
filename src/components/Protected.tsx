import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import type { UserRole } from "../types";
export default function Protected({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading">Chargement sécurisé…</div>;
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  if (roles && (!profile || !roles.includes(profile.role))) return <Navigate to="/" replace />;
  return <>{children}</>;
}
