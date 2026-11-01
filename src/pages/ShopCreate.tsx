import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import { getPosition, reverseZone, uploadShopLogo } from "../lib/utils";
import type { Coords } from "../lib/utils";

export default function ShopCreate() {
  const { user, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pos, setPos] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const locate = async () => {
    setLocating(true); setError("");
    try {
      const c = await getPosition();
      setPos(c);
      const z = await reverseZone(c);
      if (z) setZone(z);
    }
    catch (e) { setError(e instanceof Error ? e.message : "Position indisponible."); }
    setLocating(false);
  };
  useEffect(() => { void locate(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setBusy(true); setError("");
    let logoUrl: string | null = null;
    if (logoFile) {
      try { logoUrl = await uploadShopLogo(user.id, logoFile); }
      catch (er) { setError(er instanceof Error ? er.message : "Logo impossible à envoyer."); setBusy(false); return; }
    }
    const { error: err } = await supabase.from("shops").insert({
      owner_id: user.id, name: name.trim(), description: description.trim() || null,
      phone: phone.trim(), zone: zone.trim() || null, logo_url: logoUrl,
      latitude: pos ? pos.latitude : null, longitude: pos ? pos.longitude : null, is_active: true
    });
    if (err) setError(err.message);
    else { await refreshProfile(); nav("/vendeur"); }
    setBusy(false);
  };

  return <div className="section narrow"><span className="eyebrow">NOUVELLE BOUTIQUE</span><h1>Créer ta boutique</h1>
    <p className="muted">C’est gratuit. Ta boutique sera visible tout de suite, avec ton logo, ton numéro et ta zone pour que les clients te trouvent.</p>
    <form className="form-stack panel" onSubmit={submit}>
      <label>Logo de la boutique (facultatif)<input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}/></label>
      <label>Nom de la boutique<input required value={name} onChange={e => setName(e.target.value)} placeholder="Nom commercial"/></label>
      <label>Description<textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Présente ton activité…"/></label>
      <label>Numéro de téléphone (WhatsApp)<input required type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex : +509 3712 3456"/></label>
      <div className="notice"><MapPin/><span>{pos ? "Position de la boutique détectée ✔" : "Position non détectée. Autorise la localisation, puis appuie sur le bouton ci-dessous."}</span></div>
      <button type="button" className="btn btn-light" style={{ border: "1px solid #dfe6ee" }} onClick={() => void locate()} disabled={locating}><MapPin size={16}/>{locating ? "Recherche…" : "Détecter ma position GPS"}</button>
      <label>Zone / quartier (détectée automatiquement, tu peux la corriger)<input value={zone} onChange={e => setZone(e.target.value)} placeholder="Ex : Bas-Peu-de-Chose, Port-de-Paix"/></label>
      {error && <div className="notice notice-error">{error}</div>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Enregistrement…" : "Créer la boutique"}</button>
    </form></div>;
}
