import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Phone, Store } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { supabase } from "../lib/supabase";
import { autoPosition, callLink, distanceKm, formatDistance, whatsappLink } from "../lib/utils";
import type { Coords } from "../lib/utils";
import type { Product, Shop } from "../types";

export default function ShopPage() {
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [here, setHere] = useState<Coords | null>(null);

  useEffect(() => {
    let ok = true;
    const load = async () => {
      if (!supabase || !id) { setLoading(false); return; }
      const s = await supabase.from("shops")
        .select("id,owner_id,name,description,logo_url,is_active,phone,latitude,longitude,zone")
        .eq("id", id).eq("is_active", true).maybeSingle();
      const p = await supabase.from("products")
        .select("id,shop_id,name,description,price,currency,stock,image_url,category,shops(id,name)")
        .eq("shop_id", id).eq("is_active", true).gt("stock", 0).order("created_at", { ascending: false });
      if (ok) {
        setShop((s.data as Shop | null) ?? null);
        setProducts((p.data as unknown as Product[]) || []);
        setLoading(false);
      }
    };
    void load();
    void autoPosition().then(c => { if (ok && c) setHere(c); });
    return () => { ok = false; };
  }, [id]);

  if (loading) return <div className="page-loading">Chargement…</div>;
  if (!shop) return <div className="section narrow"><h1>Boutique introuvable</h1><Link to="/boutiques" className="btn btn-primary"><ArrowLeft/>Retour aux boutiques</Link></div>;

  const km = here && shop.latitude !== null && shop.longitude !== null
    ? distanceKm(here, { latitude: shop.latitude, longitude: shop.longitude })
    : null;
  const hello = "Bonjour, je viens de NOGAME MARKET et je suis intéressé par votre boutique « " + shop.name + " ».";

  return <div className="section">
    <Link to="/boutiques" className="text-link"><ArrowLeft size={16}/> Toutes les boutiques</Link>
    <div className="panel" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {shop.logo_url ? <img src={shop.logo_url} alt="" style={{ width: 64, height: 64, borderRadius: 18, objectFit: "cover" }}/> : <div className="shop-icon" style={{ width: 64, height: 64 }}><Store/></div>}
        <div><h1 style={{ margin: 0, fontSize: 28 }}>{shop.name}</h1>
          <small className="muted" style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13}/>{[shop.zone, km !== null ? formatDistance(km) + " de toi" : null].filter(Boolean).join(" · ") || "Position non indiquée"}</small></div>
      </div>
      {shop.description && <p className="muted" style={{ margin: 0 }}>{shop.description}</p>}
      {shop.phone
        ? <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn btn-primary" href={callLink(shop.phone)}><Phone size={16}/>Appeler {shop.phone}</a>
            <a className="btn btn-light" style={{ border: "1px solid #dfe6ee" }} href={whatsappLink(shop.phone, hello)} target="_blank" rel="noreferrer"><MessageCircle size={16}/>WhatsApp</a>
          </div>
        : <div className="notice">Ce vendeur n’a pas encore ajouté son numéro de téléphone.</div>}
    </div>
    <h2 className="subheading">Produits de la boutique ({products.length})</h2>
    {products.length
      ? <div className="product-grid">{products.map(p => <ProductCard key={p.id} product={p}/>)}</div>
      : <div className="empty-state"><Store/><b>Aucun produit pour le moment</b><span>Ce vendeur n’a pas encore publié de produit.</span></div>}
  </div>;
}
