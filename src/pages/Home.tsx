import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  Search,
  Store,
  Truck,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';

import {
  supabase,
  isSupabaseConfigured
} from '../lib/supabase';

import type { Product, Shop } from '../types';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const [p, s] = await Promise.all([
        supabase
          .from('products')
          .select(
            'id,shop_id,name,description,price,currency,stock,image_url,category,is_active,shops(id,name)'
          )
          .eq('is_active', true)
          .eq('moderation_status', 'visible')
          .gt('stock', 0)
          .order('created_at', { ascending: false })
          .limit(24),

        supabase
          .from('shops')
          .select(
            'id,owner_id,name,description,logo_url,is_active,phone,latitude,longitude,zone,moderation_status'
          )
          .eq('is_active', true)
          .eq('moderation_status', 'visible')
          .order('created_at', { ascending: false })
          .limit(12)
      ]);

      if (alive) {
        setProducts((p.data || []) as Product[]);
        setShops((s.data || []) as Shop[]);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = products.filter(product =>
    (
      product.name +
      ' ' +
      (product.category || '')
    )
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  return (
    <div className="nm-wrap">
      <div className="nm-search">
        <Search />

        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher un produit ou une catégorie…"
        />

        <Link to="/boutiques" className="nm-filter">
          <ArrowRight />
        </Link>
      </div>

      <section className="nm-hero">
        <div className="nm-slide-copy">
          <span className="eyebrow">
            LA MARKETPLACE HAÏTIENNE
          </span>

          <h1>
            Le commerce haïtien à portée de main.
          </h1>

          <p>
            Achetez, vendez et découvrez les boutiques près de chez vous.
          </p>

          <Link className="btn btn-orange" to="/boutiques">
            Explorer les boutiques
            <ArrowRight />
          </Link>
        </div>
      </section>

      <div className="nm-quick">
        <Link to="/boutiques">
          <Store />
          <b>Boutiques</b>
        </Link>

        <Link to="/inscription?role=merchant">
          <ShoppingBag />
          <b>Devenir vendeur</b>
        </Link>

        <Link to="/inscription?role=wholesaler">
          <Truck />
          <b>Grossiste</b>
        </Link>

        <Link to="/assistance">
          <ShieldCheck />
          <b>Assistance</b>
        </Link>
      </div>

      <div className="nm-title">
        <h2>
          <MapPin />
          Boutiques
        </h2>

        <Link to="/boutiques">
          Tout voir
          <ArrowRight />
        </Link>
      </div>

      {shops.length > 0 ? (
        <div className="shop-grid">
          {shops.map(shop => (
            <Link
              className="shop-card"
              to={`/boutique/${shop.id}`}
              key={shop.id}
            >
              {shop.logo_url ? (
                <img src={shop.logo_url} alt={shop.name} />
              ) : (
                <span className="shop-placeholder">
                  <Store />
                </span>
              )}

              <b>{shop.name}</b>

              <small>
                {shop.zone || 'Boutique locale'}
              </small>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          {loading
            ? 'Chargement des boutiques…'
            : 'Aucune boutique publiée pour le moment.'}
        </div>
      )}

      <div className="nm-title">
        <h2>
          <ShoppingBag />
          Produits disponibles
        </h2>

        <span className="muted">
          Données réelles
        </span>
      </div>

      {!isSupabaseConfigured && (
        <div className="notice">
          Configure Supabase dans .env.local pour afficher les produits réels.
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="product-grid">
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          {loading
            ? 'Chargement des produits…'
            : 'Aucun produit disponible pour le moment.'}
        </div>
      )}
    </div>
  );
}
