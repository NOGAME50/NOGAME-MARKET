import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Search, SlidersHorizontal, Store, Grid2X2,
  Flame, MapPin, ImageOff
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Product, Shop } from '../types';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadMarketplace() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const [productsResult, shopsResult] = await Promise.all([
          supabase
            .from('products')
            .select('id,shop_id,name,description,price,currency,stock,image_url,category,is_active,shops(id,name)')
            .eq('is_active', true)
            .eq('moderation_status', 'visible')
            .gt('stock', 0)
            .order('created_at', { ascending: false })
            .limit(24),
          supabase
            .from('shops')
            .select('id,owner_id,name,description,logo_url,is_active,phone,latitude,longitude,zone,moderation_status')
            .eq('is_active', true)
            .eq('moderation_status', 'visible')
            .order('created_at', { ascending: false })
            .limit(16)
        ]);

        if (!active) return;
        if (!productsResult.error) setProducts((productsResult.data || []) as Product[]);
        if (!shopsResult.error) setShops((shopsResult.data || []) as Shop[]);
      } catch (error) {
        console.error('Erreur de chargement de la marketplace :', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMarketplace();
    return () => { active = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();
    if (!value) return products;
    return products.filter(product =>
      `${product.name} ${product.category || ''}`.toLocaleLowerCase().includes(value)
    );
  }, [products, query]);

  const filteredShops = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();
    if (!value) return shops;
    return shops.filter(shop => `${shop.name} ${shop.zone || ''}`.toLocaleLowerCase().includes(value));
  }, [shops, query]);

  return (
    <div className="market-home">
      <div className="market-search-row">
        <label className="market-search">
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Rechercher une boutique ou un produit..."
            aria-label="Rechercher une boutique ou un produit"
          />
          <Link to="/boutiques" className="search-filter" aria-label="Voir les filtres et boutiques">
            <SlidersHorizontal />
          </Link>
        </label>
      </div>

      <section className="market-hero" aria-label="Découvrir NOGAME MARKET">
        <div className="hero-dots" aria-hidden="true">••••••</div>
        <div className="hero-copy">
          <span className="hero-kicker">LE COMMERCE HAÏTIEN, À PORTÉE DE MAIN</span>
          <h1>Tout ce que vous cherchez, au même endroit.</h1>
          <p>Découvrez des boutiques et des produits proposés par des vendeurs en Haïti.</p>
          <Link to="/boutiques" className="hero-cta">Explorer les boutiques <ArrowRight /></Link>
        </div>
        <img className="hero-art" src="/hero-market.svg" alt="Illustration d'un panier de courses, de sacs et d'un téléphone" />
        <div className="hero-pagination" aria-hidden="true"><i /><i /><i /></div>
      </section>

      <section className="market-shortcuts" aria-label="Accès rapides">
        <Link to="/boutiques"><Store /><b>Boutiques</b></Link>
        <a href="#produits"><Grid2X2 /><b>Catégories</b></a>
        <a href="#produits"><Flame /><b>Populaires</b></a>
        <Link to="/boutiques"><MapPin /><b>Près de moi</b></Link>
      </section>

      <section className="market-section" id="boutiques">
        <div className="market-section-heading">
          <h2><span className="heading-marker" />Boutiques populaires</h2>
          <Link to="/boutiques">Voir tout <ArrowRight /></Link>
        </div>
        {filteredShops.length > 0 ? (
          <div className="shop-carousel">
            {filteredShops.map(shop => (
              <article className="popular-shop-card" key={shop.id}>
                <Link to={`/boutique/${shop.id}`} className="popular-shop-main">
                  {shop.logo_url ? (
                    <img className="popular-shop-logo" src={shop.logo_url} alt={`Logo ${shop.name}`} loading="lazy" />
                  ) : (
                    <span className="popular-shop-placeholder"><Store /></span>
                  )}
                  <b>{shop.name}</b>
                  <small>{shop.zone || 'Boutique en Haïti'}</small>
                </Link>
                <Link to={`/boutique/${shop.id}`} className="shop-follow-button">Voir la boutique</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="market-empty">
            <Store />
            <b>{loading ? 'Chargement des boutiques…' : 'Aucune boutique disponible pour le moment.'}</b>
            <span>Les boutiques actives apparaîtront ici dès qu'elles seront publiées.</span>
          </div>
        )}
      </section>

      <section className="market-section" id="produits">
        <div className="market-section-heading">
          <h2><span className="heading-marker" />Produits tendance</h2>
          <Link to="/boutiques">Voir tout <ArrowRight /></Link>
        </div>
        {!isSupabaseConfigured && (
          <div className="market-empty"><ImageOff /><b>Connexion à la marketplace indisponible.</b><span>La configuration Supabase est nécessaire pour afficher les produits.</span></div>
        )}
        {filteredProducts.length > 0 ? (
          <div className="trending-products">
            {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : isSupabaseConfigured ? (
          <div className="market-empty">
            <ImageOff />
            <b>{loading ? 'Chargement des produits…' : 'Aucun produit disponible pour le moment.'}</b>
            <span>Les produits actifs avec du stock apparaîtront dans cette section.</span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
