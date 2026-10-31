import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Plus, Package, CreditCard, Clock3, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import type { Shop } from "../types";
export default function Merchant() {
  const { user, profile } = useAuth(); const [shops,setShops]=useState<Shop[]>([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{ let ok=true; if(supabase && user) supabase.from("shops").select("id,owner_id,name,description,logo_url,is_active").eq("owner_id",user.id).then(({data})=>{if(ok)setShops((data as Shop[])||[]);setLoading(false);}); else setLoading(false); return ()=>{ok=false;}; },[user]);
  return <div className="section"><div className="section-heading"><div><span className="eyebrow">ESPACE PROFESSIONNEL</span><h1>Centre vendeur</h1><p>Gère tes boutiques, tes produits et tes abonnements.</p></div><Link className="btn btn-primary" to="/vendeur/nouvelle-boutique"><Plus/>Créer une boutique</Link></div>
    {profile?.role !== "merchant" && profile?.role !== "wholesaler" && <div className="notice"><AlertCircle/><span>Ton profil n’a pas encore le rôle vendeur. La création d’une boutique doit être autorisée par les règles de la base de données.</span></div>}
    <div className="quick-grid"><div><Store/><b>{shops.length}</b><span>Boutiques liées à ton compte</span></div><div><Package/><b>—</b><span>Produits publiés</span></div><div><CreditCard/><b>3 formules</b><span>1, 6 ou 12 mois</span></div></div>
    <h2 className="subheading">Mes boutiques</h2>
    {loading ? <div className="empty-state">Chargement…</div> : shops.length ? <div className="shop-list">{shops.map(s=><div className="shop-row" key={s.id}><div className="shop-icon"><Store/></div><div><b>{s.name}</b><span>{s.description || "Aucune description"}</span><small>{s.is_active ? "Statut actif dans la base" : "Boutique désactivée"}</small></div><Link to={`/vendeur/boutique/${s.id}`}>Gérer</Link></div>)}</div> : <div className="empty-state"><Store/><b>Aucune boutique liée à ce compte</b><span>Crée ta première boutique pour commencer à préparer ton catalogue.</span><Link to="/vendeur/nouvelle-boutique" className="btn btn-primary">Créer une boutique</Link></div>}
    <div className="notice"><Clock3/><span>Les plans sont de 1, 6 et 12 mois. La durée commence uniquement après confirmation réelle du paiement. Une demande en attente ne déclenche jamais l’activation.</span></div>
  </div>;
}
