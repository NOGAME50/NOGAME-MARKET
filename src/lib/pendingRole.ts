import { useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../state/AuthContext';
import type { UserRole } from '../types';

// Connexion Google : le type de compte choisi avant la redirection est mémorisé ici,
// puis appliqué une fois l'utilisateur revenu sur le site.
const KEY = 'nm-pending-role';
const SELF_SERVICE: string[] = ['buyer', 'merchant', 'wholesaler'];

export function rememberPendingRole(role: UserRole) {
  try {
    localStorage.setItem(KEY, role);
  } catch {
    // stockage indisponible : le type pourra être changé dans « Mon compte »
  }
}

export function forgetPendingRole() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // rien à faire
  }
}

export function usePendingRole() {
  const { user, profile, refreshProfile } = useAuth();
  const uid = user?.id ?? null;
  const role = profile?.role ?? null;

  useEffect(() => {
    if (!supabase || !uid || !role) return;
    let pending: string | null = null;
    try {
      pending = localStorage.getItem(KEY);
    } catch {
      pending = null;
    }
    if (!pending) return;

    forgetPendingRole();
    // Un compte qui a déjà un type (autre qu'acheteur) n'est jamais écrasé.
    if (role !== 'buyer' || pending === 'buyer' || !SELF_SERVICE.includes(pending)) return;

    const client = supabase;
    const wanted = pending;
    void (async () => {
      const { error } = await client.rpc('choose_account_type', { p_role: wanted });
      if (!error) await refreshProfile();
    })();
  }, [uid, role]);
}
