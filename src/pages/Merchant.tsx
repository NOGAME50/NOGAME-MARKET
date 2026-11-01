import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Plus, Package, MapPin } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import type { Shop } from "../types";

export default function Merchant() {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    const load = async () => {
      if (!supabase || !user) { setLoading(false); return; }
      const { data } = await supabase.from("shops")
        .select("id,owner_id,name,description,logo_url,is_active,phone,latitude,longitude").eq("owner_id", user.id);
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

  const hasShop = shops.length > 0;
  const shop = shops[0];
  const hasGps = hasShop && shop.latitude !== null && shop.latitude !== undefined;
  const incomplete = hasShop && (!shop.phone || !hasGps);

  return <div className="section">
    <div className="section-heading">
      <div><span className="eyebrow">ESPACE PROFESSIONNEL</span><h1>Centre vendeur</h1><p>Gère ta boutique et tes produits.</p></div>
      {!loading && !hasShop && <Link className="btn btn-primary" to="/vendeur/nouvelle-boutique"><Plus/>Créer une boutique</Link>}
      {!loading && hasShop && <Link className="btn btn-primary" to={`/vendeur/boutique/${shop.id}`}><Plus/>Ajouter un produit</Link>}
    </div>
    {incomplete && <div className="notice"><MapPin/><span>Ajoute ton numéro de téléphone et ta position GPS pour que les clients te trouvent et te contactent. <Link to={`/vendeur/boutique/${shop.id}/infos`} className="text-link">Compléter maintenant</Link></span></div>}
    <div className="quick-grid">
      <div><Store/><b>{shops.length}</b><span>Boutique(s) sur ton compte</span></div>
      <div><Package/><b>{count}</b><span>Produit(s) enregistré(s)</span></div>
      <div><MapPin/><b>{hasGps ? "Enregistrée" : "À ajouter"}</b><span>Position GPS</span></div>
    </div>
    <h2 className="subheading">{hasShop ? "Ma boutique" : "Mes boutiques"}</h2>
    {loading ? <div className="empty-state">Chargement…</div> : hasShop
      ? <div className="shop-list">{shops.map(s => <div className="shop-row" key={s.id}>
          <div className="shop-icon"><Store/></div>
          <div><b>{s.name}</b><span>{s.description || "Aucune description"}</span><small>{s.phone ? s.phone : "Téléphone non indiqué"}</small></div>
          <div style={{ display: "grid", gap: 8 }}>
            <Link to={`/boutique/${s.id}`} style={{ color: "var(--blue)", fontWeight: 800, fontSize: 12 }}>Voir</Link>
            <Link to={`/vendeur/boutique/${s.id}`} style={{ color: "var(--blue)", fontWeight: 800, fontSize: 12 }}>Produits</Link>
            <Link to={`/vendeur/boutique/${s.id}/infos`} style={{ color: "var(--blue)", fontWeight: 800, fontSize: 12 }}>Infos & GPS</Link>
          </div>
        </div>)}</div>
      : <div className="empty-state"><Store/><b>Aucune boutique liée à ce compte</b><span>Crée ta première boutique gratuitement pour ajouter tes produits.</span><Link to="/vendeur/nouvelle-boutique" className="btn btn-primary">Créer une boutique</Link></div>}
  </div>;
}
