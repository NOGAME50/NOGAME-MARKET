import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from './supabase';

// Petit magasin partagé : tous les boutons « J'aime » de l'écran lisent les mêmes données,
// et les demandes au serveur sont regroupées (un seul appel pour toute une liste de produits).

type Listener = () => void;

const counts = new Map<string, number>(); // produit → nombre total de J'aime
const mine = new Set<string>(); // produits aimés par l'utilisateur connecté
const lastRequested = new Map<string, number>(); // produit → date de la dernière demande
const busy = new Set<string>(); // produits en cours de modification
const listeners = new Set<Listener>();

let queue = new Set<string>();
let timer: number | undefined;
let version = 0;

const REFRESH_AFTER_MS = 60_000;
const CHUNK = 50;

function emit(): void {
  version += 1;
  listeners.forEach(listener => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function fetchLikes(ids: string[]): Promise<void> {
  const client = supabase;
  if (!client || ids.length === 0) return;

  const { data, error } = await client.rpc('product_like_counts', { p_ids: ids });
  if (error) {
    console.error('Impossible de charger les J’aime :', error.message);
    ids.forEach(id => lastRequested.delete(id));
    return;
  }
  for (const row of (data ?? []) as { product_id: string; likes: number | string }[]) {
    counts.set(row.product_id, Number(row.likes));
  }

  // Mes propres J'aime (la règle de sécurité ne renvoie que les miens).
  const {
    data: { session }
  } = await client.auth.getSession();
  ids.forEach(id => mine.delete(id));
  if (session) {
    const { data: rows } = await client.from('favorites').select('product_id').in('product_id', ids);
    for (const row of (rows ?? []) as { product_id: string }[]) mine.add(row.product_id);
  }
  emit();
}

function flush(): void {
  timer = undefined;
  const ids = [...queue];
  queue = new Set();
  for (let i = 0; i < ids.length; i += CHUNK) {
    void fetchLikes(ids.slice(i, i + CHUNK));
  }
}

function requestLikes(id: string): void {
  const last = lastRequested.get(id) ?? 0;
  if (Date.now() - last < REFRESH_AFTER_MS) return;
  lastRequested.set(id, Date.now());
  queue.add(id);
  if (timer === undefined) timer = window.setTimeout(flush, 40);
}

// Connexion / déconnexion : on recharge « mes J'aime » pour les produits déjà affichés.
if (supabase) {
  const client = supabase;
  client.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') {
      mine.clear();
      emit();
    } else if (event === 'SIGNED_IN') {
      window.setTimeout(() => {
        const ids = [...counts.keys()];
        for (let i = 0; i < ids.length; i += CHUNK) void fetchLikes(ids.slice(i, i + CHUNK));
      }, 0);
    }
  });
}

export type ToggleResult = 'ok' | 'auth' | 'error';

export async function toggleLike(id: string): Promise<ToggleResult> {
  const client = supabase;
  if (!client) return 'error';
  if (busy.has(id)) return 'ok';

  const {
    data: { session }
  } = await client.auth.getSession();
  if (!session) return 'auth';

  busy.add(id);
  const wasLiked = mine.has(id);
  const before = counts.get(id) ?? 0;

  // Affichage immédiat, puis confirmation par le serveur.
  if (wasLiked) {
    mine.delete(id);
    counts.set(id, Math.max(0, before - 1));
  } else {
    mine.add(id);
    counts.set(id, before + 1);
  }
  emit();

  try {
    const { data, error } = await client.rpc('toggle_product_like', { p_product: id });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as { liked: boolean; likes: number | string } | undefined;
    if (row) {
      if (row.liked) mine.add(id);
      else mine.delete(id);
      counts.set(id, Number(row.likes));
      emit();
    }
    return 'ok';
  } catch (error) {
    console.error('J’aime impossible :', error);
    if (wasLiked) mine.add(id);
    else mine.delete(id);
    counts.set(id, before);
    emit();
    return 'error';
  } finally {
    busy.delete(id);
  }
}

export function useProductLike(id: string): { liked: boolean; likes: number; loaded: boolean } {
  useSyncExternalStore(subscribe, () => version);
  useEffect(() => {
    requestLikes(id);
  }, [id]);
  return { liked: mine.has(id), likes: counts.get(id) ?? 0, loaded: counts.has(id) };
}

export function formatLikes(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace('.', ',').replace(',0', '')}k`;
  return `${Math.round(n / 1000)}k`;
}
