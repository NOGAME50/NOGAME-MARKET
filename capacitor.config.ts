import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identifiant unique de l'app sur le Play Store : IMPOSSIBLE à changer après la première publication.
  appId: 'com.nogame.market',
  appName: 'NOGAME MARKET',
  webDir: 'dist',
  server: {
    // L'app tourne en https://localhost : indispensable pour la session Supabase et les cookies.
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    // Android 16 (API 36) dessine l'app sous la barre d'état : les marges sont exposées en CSS
    // (--safe-area-inset-top / --safe-area-inset-bottom), utilisées dans src/styles/safe-area.css.
    SystemBars: {
      insetsHandling: 'css'
    }
  }
};

export default config;
