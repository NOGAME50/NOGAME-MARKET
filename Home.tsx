import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Truck, Headphones, Search, Store, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { Product } from "../types";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) { setLoading(false); return; }
      const { data, error: err } = await supabase.from("products")
        .select("id,shop_id,name,description,price,currency,stock,image_url,category,shops(id,name)")
        .eq("is_active", true).gt("stock", 0).order("created_at", { ascending: false }).limit(24);
      if (!active) return;
      if (err) setError("Impossible de charger les produits. Vérifie la configuration et les règles Supabase.");
      else setProducts((data as unknown as Product[]) || []);
      setLoading(false);
    };
    void load(); return () => { active = false; };
  }, []);
  const filtered = products.filter(p => `${p.name} ${p.category || ""} ${p.shops?.name || ""}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="home-page">
    <section className="hero">
      <div className="hero-copy">
        <span className="hero-tag"><span className="live-dot"/> LA MARKETPLACE HAÏTIENNE</span>
        <h1>Le commerce haïtien,<br/><em>à portée de main.</em></h1>
        <p>Découvre des produits proposés par des boutiques haïtiennes. Achète et développe ton activité au même endroit.</p>
        <div className="hero-actions"><Link to="/boutiques" className="btn btn-primary">Explorer <ArrowRight size={18}/></Link><Link to="/inscription?role=merchant" className="btn btn-light">Ouvrir une boutique</Link></div>
        <div className="hero-trust"><span><ShieldCheck/>Comptes sécurisés</span><span><Store/>Vendeurs haïtiens</span></div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-cube"><ShoppingBag size={82}/><b>NM</b></div><div className="float-card float-one"><Store/> Boutiques locales</div><div className="float-card float-two"><Truck/> Commerce connecté</div></div>
    </section>
    <section className="benefits">
      <div><ShieldCheck/><b>Une plateforme centralisée</b><span>Les vendeurs et acheteurs au même endroit.</span></div>
      <div><Truck/><b>Suivi des commandes</b><span>Une base pour organiser les livraisons.</span></div>
      <div><Headphones/><b>Assistance</b><span>Un espace d’aide pour les utilisateurs.</span></div>
    </section>
    <section className="section products-section">
      <div className="section-heading"><div><span className="eyebrow">DÉCOUVRIR</span><h2>Produits disponibles</h2><p>Les articles publiés par les boutiques actives.</p></div><Link to="/boutiques" className="text-link">Voir les boutiques <ArrowRight size={16}/></Link></div>
      <label className="search-box"><Search/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un produit, une catégorie ou une boutique…"/></label>
      {!isSupabaseConfigured && <div className="notice"><b>Connexion à configurer</b><span>Ajoute les clés publiques Supabase dans le fichier .env pour afficher les produits réels.</span></div>}
      {error && <div className="notice notice-error">{error}</div>}
      {loading ? <div className="empty-state">Chargement des produits…</div> : filtered.length ? <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <div className="empty-state"><ShoppingBag/><b>Aucun produit disponible pour le moment</b><span>Les produits apparaîtront ici lorsqu’une boutique active en aura publié.</span></div>}
    </section>
    <section className="seller-banner"><div><span className="eyebrow">TU ES VENDEUR ?</span><h2>Fais grandir ton commerce avec NOGAME MARKET.</h2><p>Crée ton espace vendeur, présente tes produits et gère ton activité.</p></div><Link to="/inscription?role=merchant" className="btn btn-primary">Devenir vendeur <ArrowRight/></Link></section>
  </div>;
}