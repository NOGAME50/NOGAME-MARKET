import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Store } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import { getPosition, reverseZone, uploadShopLogo } from "../lib/utils";
import type { Shop } from "../types";

export default function ShopSettings() {
  const { id } = useParams();
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let ok = true;
    const load = async () => {
      if (!supabase || !user || !id) { setLoading(false); return; }
      const { data } = await supabase.from("shops")
        .select("id,owner_id,name,description,logo_url,is_active,phone,latitude,longitude,zone")
        .eq("id", id).eq("owner_id", user.id).maybeSingle();
      if (!ok) return;
      const s = (data as Shop | null) ?? null;
      setShop(s);
      if (s) {
        setName(s.name); setDescription(s.description || ""); setPhone(s.phone || "");
        setZone(s.zone || ""); setLogoUrl(s.logo_url ?? null);
        setLat(s.latitude ?? null); setLng(s.longitude ?? null);
      }
      setLoading(false);
    };
    void load();
    return () => { ok = false; };
  }, [id, user]);

  const locate = async () => {
    setLocating(true); setError(""); setSaved(false);
    try {
      const c = await getPosition();
      setLat(c.latitude); setLng(c.longitude);
      const z = await reverseZone(c);
      if (z) setZone(z);
    }
    catch (e) { setError(e instanceof Error ? e.message : "Position indisponible."); }
    setLocating(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !id || !user) return;
    setBusy(true); setError(""); setSaved(false);
    const patch: Record<string, unknown> = {
      name: name.trim(), description: description.trim() || null, phone: phone.trim() || null,
      zone: zone.trim() || null, latitude: lat, longitude: lng
    };
    if (logoFile) {
      try {
        const url = await uploadShopLogo(user.id, logoFile);
        patch.logo_url = url;
        setLogoUrl(url); setLogoFile(null); setFileKey(k => k + 1);
      } catch (er) { setError(er instanceof Error ? er.message : "Logo impossible à envoyer."); setBusy(false); return; }
    }
    const { data, error: err } = await supabase.from("shops").update(patch).eq("id", id).eq("owner_id", user.id).select("id");
    if (err) setError(err.message);
    else if (!data || !data.length) setError("Modification refusée. Vérifie les règles Supabase.");
    else setSaved(true);
    setBusy(false);
  };

  if (loading) return <div className="page-loading">Chargement…</div>;
  if (!shop) return <div className="section narrow"><h1>Boutique introuvable</h1><Link to="/vendeur" className="btn btn-primary"><ArrowLeft/>Retour</Link></div>;

  return <div className="section narrow">
    <Link to="/vendeur" className="text-link"><ArrowLeft size={16}/> Centre vendeur</Link>
    <h1>Infos de la boutique</h1>
    <form className="form-stack panel" onSubmit={submit}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {logoUrl ? <img src={logoUrl} alt="" style={{ width: 72, height: 72, borderRadius: 20, objectFit: "cover" }}/> : <div className="shop-icon" style={{ width: 72, height: 72 }}><Store/></div>}
        <label style={{ flex: 1 }}>Logo de la boutique<input key={fileKey} type="file" accept="image/*" onChange={e => { setLogoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null); setSaved(false); }}/></label>
      </div>
      <label>Nom de la boutique<input required value={name} onChange={e => { setName(e.target.value); setSaved(false); }}/></label>
      <label>Description<textarea rows={3} value={description} onChange={e => { setDescription(e.target.value); setSaved(false); }}/></label>
      <label>Numéro de téléphone (WhatsApp)<input type="tel" inputMode="tel" value={phone} onChange={e => { setPhone(e.target.value); setSaved(false); }} placeholder="Ex : +509 3712 3456"/></label>
      <div className="notice"><MapPin/><span>{lat !== null && lng !== null ? "Position enregistrée : " + lat.toFixed(5) + ", " + lng.toFixed(5) : "Aucune position GPS pour le moment."}</span></div>
      <button type="button" className="btn btn-light" style={{ border: "1px solid #dfe6ee" }} onClick={() => void locate()} disabled={locating}><MapPin size={16}/>{locating ? "Recherche…" : "Détecter ma position GPS"}</button>
      <label>Zone / quartier (détectée automatiquement, tu peux la corriger)<input value={zone} onChange={e => { setZone(e.target.value); setSaved(false); }} placeholder="Ex : Bas-Peu-de-Chose, Port-de-Paix"/></label>
      {error && <div className="notice notice-error">{error}</div>}
      {saved && <div className="notice">Modifications enregistrées ✔</div>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  </div>;
}
