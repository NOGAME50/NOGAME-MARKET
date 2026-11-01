import type { Shop } from "../types";
import { supabase } from "./supabase";

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

export async function reverseZone(c: Coords): Promise<string> {
  try {
    const url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&accept-language=fr&lat=" + c.latitude + "&lon=" + c.longitude;
    const res = await fetch(url);
    if (!res.ok) return "";
    const j = (await res.json()) as { address?: Record<string, string>; display_name?: string };
    const a = j.address || {};
    const local = a.neighbourhood || a.suburb || a.quarter || a.hamlet || a.village || a.city_district || "";
    const town = a.city || a.town || a.municipality || a.county || "";
    const parts = [local, town].filter((x, i, arr) => x && arr.indexOf(x) === i);
    if (parts.length) return parts.join(", ");
    if (a.state) return a.state;
    return j.display_name ? j.display_name.split(",").slice(0, 2).join(",").trim() : "";
  } catch {
    return "";
  }
}

export async function shrinkImage(file: File, max = 1200): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image illisible");
  ctx.drawImage(bmp, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Compression impossible")), "image/jpeg", 0.85));
}

export async function uploadShopLogo(userId: string, file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  let blob: Blob;
  try { blob = await shrinkImage(file, 512); }
  catch { throw new Error("Cette image ne peut pas être lue. Choisis une photo JPG, PNG ou WEBP."); }
  const path = userId + "/logo-" + Date.now() + ".jpg";
  const up = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
  if (up.error) throw new Error("Envoi du logo impossible : " + up.error.message);
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}
