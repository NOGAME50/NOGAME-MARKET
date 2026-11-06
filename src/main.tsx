import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import App from './App';
import { AuthProvider } from './state/AuthContext';
import { registerNativeAuthCallback } from './lib/nativeAuthCallback';
import NativeBackButton from './lib/NativeBackButton';

import './styles.css';
import './theme.css';
import './styles/market-home.css';
import './styles/messages.css';
import './styles/safe-area.css';
import './styles/native-app.css';

// Application Android : bloque la sélection de texte et le menu d'appui long (hors champs de saisie).
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native-app');
  document.addEventListener('contextmenu', event => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, [contenteditable="true"]')) return;
    event.preventDefault();
  });
}

// Enregistre le retour OAuth Android avant le montage de l'interface.
void registerNativeAuthCallback();

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NativeBackButton />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
