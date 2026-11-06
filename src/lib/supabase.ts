import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anon);

// Android : stockage natif persistant (SharedPreferences) plutôt que localStorage WebView.
// Web : stockage local standard du navigateur.
const nativeAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const result = await Preferences.get({ key });
    return result.value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  }
};

export const supabase = isSupabaseConfigured
  ? createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // PKCE : le retour OAuth contient un « code » à échanger contre la session.
        flowType: "pkce",
        detectSessionInUrl: !Capacitor.isNativePlatform(),
        ...(Capacitor.isNativePlatform() ? { storage: nativeAuthStorage } : {})
      }
    })
  : null;
