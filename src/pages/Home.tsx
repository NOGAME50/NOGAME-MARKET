import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, MapPin, Search, ShoppingBag, SlidersHorizontal, Store } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ShopRound from "../components/ShopRound";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import { autoPosition, getPosition, rankShops } from "../lib/utils";
import type { Coords } from "../lib/utils";
import type { Product, Shop } from "../types";

const slides = [
  { image: "/banner-1.jpg", title: "Le commerce haïtien à portée de main", text: "Achète et vends près de chez toi.", to: "/boutiques", cta: "Explorer" },
  { image: "", title: "Boutiques près de toi", text: "Trouve les vendeurs autour de toi, avec leur distance exacte.", to: "/boutiques", cta: "Voir les boutiques" },
  { image: "", title: "Vends gratuitement", text: "Ouvre ta boutique, ajoute tes produits et reçois les appels.", to: "/vendeur", cta: "Ouvrir ma boutique" }
];

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
  const [slide, setSlide] = useState(0);
  const [bannerBroken, setBannerBroken] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [cat, setCat] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) { setLoading(false); return; }
      const [pr, sh] = await Promise.all([
        supabase.from("products")
          .select("id,shop_id,name,description,price,currency,stock,image_url,category,shops(id,name)")
          .eq("is_active", true).gt("stock", 0).order("created_at", { ascending: false }).limit(48),
        supabase.from("shops")
          .select("id,owner_id,name,description,logo_url,is_active,phone,latitude,longitude,zone")
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

  useEffect(() => {
    const t = window.setInterval(() => setSlide(i => (i + 1) % slides.length), 5000);
    return () => window.clearInterval(t);
  }, []);

  const goTo = (id: string) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const locate = async () => {
    setGeoMsg("");
    try { setHere(await getPosition()); goTo("boutiques"); }
    catch (e) { setGeoMsg(e instanceof Error ? e.message : "Position indisponible."); }
  };

  const q = query.trim().toLowerCase();
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter((c): c is string => !!c))), [products]);
  const filtered = products.filter(p => (!cat || p.category === cat) && `${p.name} ${p.category || ""} ${p.shops?.name || ""}`.toLowerCase().includes(q));
  const ranked = useMemo(() => rankShops(shops.filter(s => (s.name + " " + (s.zone || "")).toLowerCase().includes(q)), here), [shops, q, here]);

  return <div className="nm-wrap">
    <label className="nm-search"><Search/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une boutique ou un produit…"/>
      <button type="button" className={`nm-filter ${showCats ? "on" : ""}`} onClick={() => setShowCats(v => !v)} aria-label="Filtres"><SlidersHorizontal/></button></label>

    {showCats && <div className="nm-cats">
      <button className={!cat ? "on" : ""} onClick={() => setCat(null)}>Toutes</button>
      {categories.map(c => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}
      {!categories.length && <span className="muted">Aucune catégorie pour le moment.</span>}
    </div>}

    <div className="nm-hero">
      {slides.map((s, i) => {
        const hasImg = !!s.image && !bannerBroken;
        return <Link key={i} to={s.to} className={`nm-slide ${slide === i ? "on" : ""}`}>
          {hasImg && <img src={s.image} alt="" onError={() => setBannerBroken(true)}/>}
          {!hasImg && <div className="nm-slide-copy"><h2>{s.title}</h2><p>{s.text}</p><span>{s.cta} <ArrowRight size={14}/></span></div>}
        </Link>;
      })}
      <div className="nm-dots">{slides.map((_, i) => <button key={i} className={slide === i ? "on" : ""} onClick={() => setSlide(i)} aria-label={"Bannière " + (i + 1)}/>)}</div>
    </div>

    <div className="nm-quick">
      <Link to="/boutiques"><Store/>Boutiques</Link>
      <button onClick={() => setShowCats(v => !v)}><ShoppingBag/>Catégories</button>
      <button className="fire" onClick={() => goTo("tendance")}><Flame/>Populaires</button>
      <button onClick={() => void locate()}><MapPin/>Près de moi</button>
    </div>

    {geoMsg && <div className="notice notice-error">{geoMsg}</div>}
    {!isSupabaseConfigured && <div className="notice"><b>Connexion à configurer</b><span>Ajoute les clés publiques Supabase pour afficher les boutiques réelles.</span></div>}
    {error && <div className="notice notice-error">{error}</div>}

    <div className="nm-title" id="boutiques"><h2>{here ? "Boutiques près de toi" : "Boutiques populaires"}</h2><Link to="/boutiques">Voir tout <ArrowRight size={16}/></Link></div>
    {loading ? <div className="empty-state">Chargement…</div> : ranked.length
      ? <div className="nm-hscroll">{ranked.slice(0, 12).map(x => <ShopRound key={x.shop.id} shop={x.shop} km={x.km}/>)}</div>
      : <div className="empty-state"><Store/><b>Aucune boutique trouvée</b><span>Les boutiques apparaîtront ici dès qu’un vendeur en aura créé une.</span></div>}

    <div className="nm-title" id="tendance"><h2>Produits tendance</h2><button onClick={() => setShowAll(v => !v)}>{showAll ? "Réduire" : "Voir tout"} <ArrowRight size={16}/></button></div>
    {loading ? <div className="empty-state">Chargement des produits…</div> : filtered.length
      ? (showAll
          ? <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p}/>)}</div>
          : <div className="nm-hscroll">{filtered.slice(0, 12).map(p => <ProductCard key={p.id} product={p}/>)}</div>)
      : <div className="empty-state"><ShoppingBag/><b>Aucun produit disponible pour le moment</b><span>Les produits apparaîtront ici lorsqu’une boutique en aura publié.</span></div>}

    {!isSeller && <section className="seller-banner" style={{ width: "100%", margin: "30px 0 20px" }}><div><span className="eyebrow">TU ES VENDEUR ?</span><h2>Ouvre ta boutique gratuitement.</h2><p>Crée ton espace vendeur, ajoute tes produits et reçois les appels et messages de tes clients.</p></div><Link to="/vendeur" className="btn btn-primary">Devenir vendeur <ArrowRight/></Link></section>}
  </div>;
}
