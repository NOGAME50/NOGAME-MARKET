import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

const CALLBACK_PREFIX = 'com.nogame.market://login-callback';
let lastHandledUrl = '';

async function handleAuthCallback(url: string): Promise<void> {
  if (!url.startsWith(CALLBACK_PREFIX) || url === lastHandledUrl || !supabase) return;
  lastHandledUrl = url;

  try {
    const parsed = new URL(url);
    const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));

    // Erreur renvoyée par Supabase ou Google (ex. accès refusé).
    const authError =
      parsed.searchParams.get('error_description') ?? hash.get('error_description');
    if (authError) throw new Error(authError);

    const code = parsed.searchParams.get('code');
    if (code) {
      // Flux PKCE : on échange uniquement le code (pas l'URL complète).
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else {
      // Secours : flux implicite avec jetons dans le #hash.
      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
      if (!access_token || !refresh_token) {
        throw new Error('Retour OAuth sans code ni jeton.');
      }
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
    }

    await Browser.close().catch(() => undefined);
    // Retour à l'écran du compte dans l'application après validation de la session.
    window.history.replaceState({}, '', '/compte');
    window.dispatchEvent(new PopStateEvent('popstate'));
  } catch (error) {
    console.error('Échec du retour OAuth Google :', error);
    await Browser.close().catch(() => undefined);
  }
}

export async function registerNativeAuthCallback(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await App.addListener('appUrlOpen', ({ url }) => {
    void handleAuthCallback(url);
  });

  // Quand l'app revient au premier plan, on relance le rafraîchissement du jeton
  // pour que la session reste ouverte même après un long passage en arrière-plan.
  await App.addListener('appStateChange', ({ isActive }) => {
    if (!supabase) return;
    if (isActive) {
      void supabase.auth.startAutoRefresh();
      void supabase.auth.getSession();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });

  // Gère aussi le cas où Android ouvre l'application directement sur le lien OAuth.
  const launch = await App.getLaunchUrl();
  if (launch?.url) await handleAuthCallback(launch.url);
}
