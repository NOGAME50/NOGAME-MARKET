import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import { getPosition } from "../lib/utils";
import type { Shop } from "../types";

export default function ShopSettings() {
  const { id } = useParams();
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
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
        .select("id,owner_id,name,description,logo_url,is_active,phone,latitude,longitude")
        .eq("id", id).eq("owner_id", user.id).maybeSingle();
      if (!ok) return;
      const s = (data as Shop | null) ?? null;
      setShop(s);
      if (s) { setName(s.name); setDescription(s.description || ""); setPhone(s.phone || ""); setLat(s.latitude ?? null); setLng(s.longitude ?? null); }
      setLoading(false);
    };
    void load();
    return () => { ok = false; };
  }, [id, user]);

  const locate = async () => {
    setLocating(true); setError(""); setSaved(false);
    try { const c = await getPosition(); setLat(c.latitude); setLng(c.longitude); }
    catch (e) { setError(e instanceof Error ? e.message : "Position indisponible."); }
    setLocating(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !id || !user) return;
    setBusy(true); setError(""); setSaved(false);
    const { data, error: err } = await supabase.from("shops")
      .update({ name: name.trim(), description: description.trim() || null, phone: phone.trim() || null, latitude: lat, longitude: lng })
      .eq("id", id).eq("owner_id", user.id).select("id");
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
      <label>Nom de la boutique<input required value={name} onChange={e => { setName(e.target.value); setSaved(false); }}/></label>
      <label>Description<textarea rows={3} value={description} onChange={e => { setDescription(e.target.value); setSaved(false); }}/></label>
      <label>Numéro de téléphone (WhatsApp)<input type="tel" inputMode="tel" value={phone} onChange={e => { setPhone(e.target.value); setSaved(false); }} placeholder="Ex : +509 3712 3456"/></label>
      <div className="notice"><MapPin/><span>{lat !== null && lng !== null ? "Position enregistrée : " + lat.toFixed(5) + ", " + lng.toFixed(5) : "Aucune position GPS pour le moment."}</span></div>
      <button type="button" className="btn btn-light" style={{ border: "1px solid #dfe6ee" }} onClick={() => void locate()} disabled={locating}><MapPin size={16}/>{locating ? "Recherche…" : "Détecter ma position GPS"}</button>
      {error && <div className="notice notice-error">{error}</div>}
      {saved && <div className="notice">Modifications enregistrées ✔</div>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  </div>;
}
