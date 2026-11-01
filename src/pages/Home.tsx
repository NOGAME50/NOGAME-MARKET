import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ShieldCheck, Truck, Headphones, Search, Store, ShoppingBag, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ShopCard from "../components/ShopCard";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import { autoPosition, getPosition, rankShops } from "../lib/utils";
import type { Coords } from "../lib/utils";
import type { Product, Shop } from "../types";

export default function Home() {
  const { profile } = useAuth();
  const isSeller = profile?.role === "merchant" || profile?.role === "wholesaler";
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [here, setHere] = useState<Coords | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) { setLoading(false); return; }
      const [pr, sh] = await Promise.all([
        supabase.from("products")
          .select("id,shop_id,name,description,price,currency,stock,image_url,category,shops(id,name)")
          .eq("is_active", true).gt("stock", 0).order("created_at", { ascending: false }).limit(24),
        supabase.from("shops")
          .select("id,owner_id,name,description,logo_url,is_active,phone,latitude,longitude")
          .eq("is_active", true).order("created_at", { ascending: false }).limit(300)
      ]);
      if (!active) return;
      if (pr.error || sh.error) setError("Impossible de charger les données. Vérifie la configuration et les règles Supabase.");
      if (!pr.error) setProducts((pr.data as unknown as Product[]) || []);
      if (!sh.error) setShops((sh.data as Shop[]) || []);
      setLoading(false);
    };
    void load();
    void autoPosition().then(p => { if (active && p) setHere(p); });
    return () => { active = false; };
  }, []);

  const locate = async () => {
    setLocating(true); setGeoMsg("");
    try { setHere(await getPosition()); }
    catch (e) { setGeoMsg(e instanceof Error ? e.message : "Position indisponible."); }
    setLocating(false);
  };

  const q = query.trim().toLowerCase();
  const filtered = products.filter(p => `${p.name} ${p.category || ""} ${p.shops?.name || ""}`.toLowerCase().includes(q));
  const ranked = useMemo(() => rankShops(shops.filter(s => s.name.toLowerCase().includes(q)), here), [shops, q, here]);

  return <div className="home-page">
    <section className="hero">
      <div className="hero-copy">
        <span className="hero-tag"><span className="live-dot"/> LA MARKETPLACE HAÏTIENNE</span>
        <h1>Le commerce haïtien,<br/><em>à portée de main.</em></h1>
        <p>Découvre des produits proposés par des boutiques haïtiennes. Achète et développe ton activité au même endroit.</p>
        <div className="hero-actions"><Link to="/boutiques" className="btn btn-primary">Explorer <ArrowRight size={18}/></Link>{isSeller ? <Link to="/vendeur" className="btn btn-light">Mon espace vendeur</Link> : <Link to="/vendeur" className="btn btn-light">Ouvrir une boutique</Link>}</div>
        <div className="hero-trust"><span><ShieldCheck/>Comptes sécurisés</span><span><Store/>Vendeurs haïtiens</span></div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-cube"><ShoppingBag size={82}/><b>NM</b></div><div className="float-card float-one"><Store/> Boutiques locales</div><div className="float-card float-two"><Truck/> Commerce connecté</div></div>
    </section>

    <section className="section" style={{ marginBottom: 20 }}>
      <div className="section-heading"><div><span className="eyebrow">PRÈS DE TOI</span><h2>Boutiques</h2><p>{here ? "Les plus proches de toi en premier." : "Active ta position pour voir les boutiques les plus proches."}</p></div><Link to="/boutiques" className="text-link">Toutes les boutiques <ArrowRight size={16}/></Link></div>
      <label className="search-box"><Search/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une boutique ou un produit…"/></label>
      <button className="btn btn-light" style={{ border: "1px solid #dfe6ee", marginBottom: 8 }} onClick={() => void locate()} disabled={locating}><MapPin size={16}/>{locating ? "Recherche de ta position…" : here ? "Position activée" : "Boutiques près de moi"}</button>
      {geoMsg && <div className="notice notice-error">{geoMsg}</div>}
      {!isSupabaseConfigured && <div className="notice"><b>Connexion à configurer</b><span>Ajoute les clés publiques Supabase pour afficher les boutiques réelles.</span></div>}
      {error && <div className="notice notice-error">{error}</div>}
      {loading ? <div className="empty-state">Chargement…</div> : ranked.length
        ? ranked.slice(0, 6).map(x => <ShopCard key={x.shop.id} shop={x.shop} km={x.km}/>)
        : <div className="empty-state"><Store/><b>Aucune boutique trouvée</b><span>Les boutiques apparaîtront ici dès qu’un vendeur en aura créé une.</span></div>}
    </section>

    <section className="benefits">
      <div><ShieldCheck/><b>Une plateforme centralisée</b><span>Les vendeurs et acheteurs au même endroit.</span></div>
      <div><Truck/><b>Suivi des commandes</b><span>Une base pour organiser les livraisons.</span></div>
      <div><Headphones/><b>Assistance</b><span>Un espace d’aide pour les utilisateurs.</span></div>
    </section>

    <section className="section products-section">
      <div className="section-heading"><div><span className="eyebrow">DÉCOUVRIR</span><h2>Produits disponibles</h2><p>Les articles publiés par les boutiques.</p></div></div>
      {loading ? <div className="empty-state">Chargement des produits…</div> : filtered.length ? <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <div className="empty-state"><ShoppingBag/><b>Aucun produit disponible pour le moment</b><span>Les produits apparaîtront ici lorsqu’une boutique en aura publié.</span></div>}
    </section>
    {!isSeller && <section className="seller-banner"><div><span className="eyebrow">TU ES VENDEUR ?</span><h2>Ouvre ta boutique gratuitement.</h2><p>Crée ton espace vendeur, ajoute tes produits et reçois les appels et messages de tes clients.</p></div><Link to="/vendeur" className="btn btn-primary">Devenir vendeur <ArrowRight/></Link></section>}
  </div>;
}
