import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import {
  MapPin,
  Phone,
  MessageCircle,
  Store
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import type { Product, Shop } from '../types';

import ProductCard from '../components/ProductCard';

import {
  callLink,
  whatsappLink
} from '../lib/utils';

export default function ShopPage() {
  const { id } = useParams();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!supabase || !id) {
        setLoading(false);
        return;
      }

      const s = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .eq('moderation_status', 'visible')
        .maybeSingle();

      const p = await supabase
        .from('products')
        .select(
          'id,shop_id,name,description,price,currency,stock,image_url,category,is_active,shops(id,name)'
        )
        .eq('shop_id', id)
        .eq('is_active', true)
        .eq('moderation_status', 'visible')
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (alive) {
        setShop(s.data as Shop | null);
        setProducts((p.data || []) as Product[]);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="section">
        Chargement…
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="section empty-state">
        Boutique introuvable ou indisponible.

        <Link to="/boutiques">
          Retour aux boutiques
        </Link>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="shop-hero">
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.name} />
        ) : (
          <span className="shop-placeholder">
            <Store />
          </span>
        )}

        <div>
          <span className="eyebrow">
            BOUTIQUE
          </span>

          <h1>{shop.name}</h1>

          <p>{shop.description}</p>

          <small>
            <MapPin size={14} />
            {shop.zone || 'Localisation non indiquée'}
          </small>

          <div className="action-row">
            {shop.phone && (
              <a
                className="btn btn-primary"
                href={callLink(shop.phone)}
              >
                <Phone />
                Appeler
              </a>
            )}

            {shop.phone && (
              <a
                className="btn btn-light"
                href={whatsappLink(
                  shop.phone,
                  'Bonjour, je vous contacte depuis NOGAME MARKET.'
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      <h2>Produits disponibles</h2>

      {products.length > 0 ? (
        <div className="product-grid">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Aucun produit disponible dans cette boutique.
        </div>
      )}
    </div>
  );
}
