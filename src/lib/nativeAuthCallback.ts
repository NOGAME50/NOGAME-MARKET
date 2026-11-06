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
    const { error } = await supabase.auth.exchangeCodeForSession(url);
    if (error) throw error;
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

  // Gère aussi le cas où Android ouvre l'application directement sur le lien OAuth.
  const launch = await App.getLaunchUrl();
  if (launch?.url) await handleAuthCallback(launch.url);
}
