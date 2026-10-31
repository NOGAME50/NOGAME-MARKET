import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
export default function ShopCreate() {
 const {user}=useAuth(); const [name,setName]=useState(""); const [description,setDescription]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const nav=useNavigate();
 const submit=async(e:FormEvent)=>{e.preventDefault();if(!supabase||!user)return;setBusy(true);const {error:err}=await supabase.from("shops").insert({owner_id:user.id,name,description,is_active:false});if(err)setError(err.message);else nav("/vendeur");setBusy(false);};
 return <div className="section narrow"><span className="eyebrow">NOUVELLE BOUTIQUE</span><h1>Créer ta boutique</h1><p className="muted">Les informations seront enregistrées dans Supabase. La boutique reste masquée tant que son activation et son abonnement ne sont pas validés.</p><form className="form-stack panel" onSubmit={submit}><label>Nom de la boutique<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nom commercial"/></label><label>Description<textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Présente ton activité…"/></label>{error&&<div className="notice notice-error">{error}</div>}<button className="btn btn-primary" disabled={busy}>{busy?"Enregistrement…":"Créer la boutique"}</button></form></div>;
}
