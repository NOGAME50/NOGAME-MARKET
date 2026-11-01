import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Plus, Package, AlertCircle, BadgeCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import type { Shop } from "../types";

export default function Merchant() {
  const { user, profile } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    const load = async () => {
      if (!supabase || !user) { setLoading(false); return; }
      const { data } = await supabase.from("shops").select("id,owner_id,name,description,logo_url,is_active").eq("owner_id", user.id);
      const list = (data as Shop[]) || [];
      let total = 0;
      if (list.length) {
        const res = await supabase.from("products").select("id", { count: "exact", head: true }).in("shop_id", list.map(s => s.id));
        total = res.count || 0;
      }
      if (ok) { setShops(list); setCount(total); setLoading(false); }
    };
    void load();
    return () => { ok = false; };
  }, [user]);

  const isSeller = profile?.role === "merchant" || profile?.role === "wholesaler";
  const hasShop = shops.length > 0;

  return <div className="section">
    <div className="section-heading">
      <div><span className="eyebrow">ESPACE PROFESSIONNEL</span><h1>Centre vendeur</h1><p>Gère ta boutique et tes produits.</p></div>
      {!loading && !hasShop && isSeller && <Link className="btn btn-primary" to="/vendeur/nouvelle-boutique"><Plus/>Créer une boutique</Link>}
    </div>
    {!isSeller && <div className="notice"><AlertCircle/><span>Ton profil n’a pas encore le rôle vendeur. Il doit être autorisé avant de créer une boutique.</span></div>}
    <div className="quick-grid">
      <div><Store/><b>{shops.length}</b><span>Boutique(s) sur ton compte</span></div>
      <div><Package/><b>{count}</b><span>Produit(s) enregistré(s)</span></div>
      <div><BadgeCheck/><b>{hasShop ? (shops[0].is_active ? "Active" : "En attente") : "—"}</b><span>Statut de la boutique</span></div>
    </div>
    <h2 className="subheading">{hasShop ? "Ma boutique" : "Mes boutiques"}</h2>
    {loading ? <div className="empty-state">Chargement…</div> : hasShop
      ? <div className="shop-list">{shops.map(s => <div className="shop-row" key={s.id}>
          <div className="shop-icon"><Store/></div>
          <div><b>{s.name}</b><span>{s.description || "Aucune description"}</span><small>{s.is_active ? "Boutique active" : "En attente d’activation"}</small></div>
          <Link to={`/vendeur/boutique/${s.id}`}>Gérer</Link>
        </div>)}</div>
      : <div className="empty-state"><Store/><b>Aucune boutique liée à ce compte</b><span>Crée ta première boutique pour commencer à ajouter tes produits.</span>{isSeller && <Link to="/vendeur/nouvelle-boutique" className="btn btn-primary">Créer une boutique</Link>}</div>}
  </div>;
}
