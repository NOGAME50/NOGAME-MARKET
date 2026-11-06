import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Gère le bouton Retour physique d'Android dans NOGAME MARKET.
 * - Revient à la page précédente quand une navigation existe.
 * - Depuis une page secondaire sans historique, revient à l'accueil.
 * - Depuis l'accueil, minimise l'application au lieu de la fermer brutalement.
 */
export default function NativeBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let active = true;
    let listener: { remove: () => Promise<void> } | undefined;

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const historyIndex = Number(window.history.state?.idx ?? 0);
      const hasPreviousPage = canGoBack || historyIndex > 0;

      if (hasPreviousPage) {
        navigate(-1);
        return;
      }

      if (location.pathname !== '/') {
        navigate('/', { replace: true });
        return;
      }

      // À l'accueil, garder l'application en arrière-plan plutôt que la quitter.
      void CapacitorApp.minimizeApp();
    }).then((handle) => {
      if (active) {
        listener = handle;
      } else {
        void handle.remove();
      }
    }).catch((error) => {
      console.error('Impossible d’activer le bouton Retour Android :', error);
    });

    return () => {
      active = false;
      if (listener) void listener.remove();
    };
  }, [navigate, location.pathname]);

  return null;
}
