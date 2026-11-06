import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

const CALLBACK_PREFIX = 'com.nogame.market://login-callback';

let lastHandledUrl = '';

async function handleAuthCallback(url: string): Promise<void> {
  if (
    !Capacitor.isNativePlatform() ||
    !url.startsWith(CALLBACK_PREFIX) ||
    url === lastHandledUrl ||
    !supabase
  ) {
    return;
  }

  lastHandledUrl = url;

  try {
    const callbackUrl = new URL(url);

    const errorDescription =
      callbackUrl.searchParams.get('error_description');

    const code = callbackUrl.searchParams.get('code');

    if (errorDescription) {
      throw new Error(errorDescription);
    }

    if (!code) {
      throw new Error('Code de connexion Google absent.');
    }

    const { error } = await supabase.auth.exchangeCodeForSession(url);

    if (error) {
      throw error;
    }

    // Fermer le navigateur après la récupération de la session.
    await Browser.close().catch(() => undefined);

    // Afficher la page du compte dans l'application.
    window.history.replaceState({}, '', '/compte');

    window.dispatchEvent(new PopStateEvent('popstate'));

  } catch (error) {
    console.error('Erreur OAuth Google :', error);

    await Browser.close().catch(() => undefined);

    lastHandledUrl = '';
  }
}

export async function registerNativeAuthCallback(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  await App.addListener('appUrlOpen', ({ url }) => {
    void handleAuthCallback(url);
  });

  const launch = await App.getLaunchUrl();

  if (launch?.url) {
    await handleAuthCallback(launch.url);
  }
}
