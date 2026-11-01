import type { Shop } from "../types";

export interface Coords { latitude: number; longitude: number; }

export function getPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Le GPS n’est pas disponible sur cet appareil.")); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => reject(new Error("Position refusée ou indisponible. Autorise la localisation puis réessaie.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}

export async function autoPosition(): Promise<Coords | null> {
  try {
    if (!navigator.geolocation || !navigator.permissions) return null;
    const state = await navigator.permissions.query({ name: "geolocation" });
    if (state.state !== "granted") return null;
    return await getPosition();
  } catch {
    return null;
  }
}

export function distanceKm(a: Coords, b: Coords): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const x = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.pow(Math.sin(dLon / 2), 2);
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

export function formatDistance(km: number): string {
  return km < 1 ? Math.max(1, Math.round(km * 10) * 100) + " m" : km.toFixed(1) + " km";
}

export interface ShopDist { shop: Shop; km: number | null; }

export function rankShops(shops: Shop[], here: Coords | null): ShopDist[] {
  const list: ShopDist[] = shops.map(shop => ({
    shop,
    km: here && shop.latitude !== null && shop.longitude !== null && shop.latitude !== undefined && shop.longitude !== undefined
      ? distanceKm(here, { latitude: shop.latitude, longitude: shop.longitude })
      : null
  }));
  if (here) list.sort((a, b) => a.km === null ? (b.km === null ? 0 : 1) : b.km === null ? -1 : a.km - b.km);
  return list;
}

export function phoneDigits(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 8) d = "509" + d;
  return d;
}

export function whatsappLink(phone: string, text?: string): string {
  return "https://wa.me/" + phoneDigits(phone) + (text ? "?text=" + encodeURIComponent(text) : "");
}

export function callLink(phone: string): string {
  return "tel:+" + phoneDigits(phone);
}
