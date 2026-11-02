import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';

import { supabase } from '../lib/supabase';

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileError: null,
  refreshProfile: async () => {}
});

export function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Récupération du profil utilisateur
  const refreshProfile = async (): Promise<void> => {
    if (!supabase) {
      setProfile(null);
      setProfileError('Supabase n’est pas configuré.');
      return;
    }

    try {
      const {
        data: { session: current },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!current) {
        setProfile(null);
        setProfileError('Aucune session utilisateur active.');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id,full_name,role,phone,created_at')
        .eq('id', current.user.id)
        .maybeSingle();

      if (error) {
        console.error('Erreur récupération profil :', error);
        setProfile(null);
        setProfileError(error.message);
        return;
      }

      if (!data) {
        setProfile(null);
        setProfileError('Aucun profil trouvé pour cet utilisateur.');
        return;
      }

      setProfile(data as Profile);
      setProfileError(null);

    } catch (error) {
      console.error('Erreur AuthContext :', error);

      setProfile(null);
      setProfileError(
        error instanceof Error
          ? error.message
          : 'Erreur inconnue lors du chargement du profil.'
      );
    }
  };

  // Initialisation de l'authentification
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setProfileError('Supabase n’est pas configuré.');
      return;
    }

    // Référence non nullable pour TypeScript
    const client = supabase;

    let alive = true;

    const initialize = async () => {
      try {
        const {
          data: { session: current },
          error
        } = await client.auth.getSession();

        if (error) {
          throw error;
        }

        if (!alive) return;

        setSession(current);

        if (current) {
          await refreshProfile();
        } else {
          setProfile(null);
          setProfileError(null);
        }

      } catch (error) {
        console.error('Initialisation AuthContext :', error);

        setProfileError(
          error instanceof Error
            ? error.message
            : 'Impossible de vérifier la session.'
        );

      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void initialize();

    // Surveillance des changements de session
    const {
      data: { subscription }
    } = client.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);

        if (!nextSession) {
          setProfile(null);
          setProfileError(null);
          return;
        }

        window.setTimeout(() => {
          void refreshProfile();
        }, 0);
      }
    );

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        profileError,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
