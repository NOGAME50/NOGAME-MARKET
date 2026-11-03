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
import ContactSellerButton from '../components/ContactSellerButton';

import {
  callLink,
  whatsappLink
} from '../lib/utils';

export default function ShopPage() {
  const { id } = useParams();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadShop() {
      if (!supabase) {
        setError('Connexion à Supabase indisponible.');
        setLoading(false);
        return;
      }

      if (!id) {
        setError('Identifiant de boutique introuvable.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Récupération de la boutique
        const shopResult = await supabase
          .from('shops')
          .select(`
            id,
            owner_id,
            name,
            description,
            logo_url,
            is_active,
            created_at,
            phone,
            latitude,
            longitude,
            zone
          `)
          .eq('id', id)
          .eq('is_active', true)
          .maybeSingle();

        if (shopResult.error) {
          throw shopResult.error;
        }

        if (!shopResult.data) {
          if (alive) {
            setShop(null);
            setProducts([]);
          }
          return;
        }

        // Récupération des produits de cette boutique
        const productsResult = await supabase
          .from('products')
          .select(`
            id,
            shop_id,
            name,
            description,
            price,
            currency,
            stock,
            image_url,
            category,
            is_active,
            shops (
              id,
              name
            )
          `)
          .eq('shop_id', id)
          .eq('is_active', true)
          .gt('stock', 0)
          .order('created_at', { ascending: false });

        if (productsResult.error) {
          throw productsResult.error;
        }

        if (!alive) return;

        setShop(shopResult.data as Shop);
        setProducts(
          (productsResult.data || []) as Product[]
        );

      } catch (err) {
        console.error(
          'Erreur de chargement de la boutique :',
          err
        );

        if (alive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger cette boutique.'
          );
        }

      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadShop();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="section">
        Chargement de la boutique…
      </div>
    );
  }

  if (error) {
    return (
      <div className="section empty-state">
        <Store />

        <h2>Impossible de charger la boutique</h2>

        <p>{error}</p>

        <Link to="/boutiques">
          Retour aux boutiques
        </Link>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="section empty-state">
        <Store />

        <h2>Boutique introuvable ou indisponible</h2>

        <Link to="/boutiques">
          Retour aux boutiques
        </Link>
      </div>
    );
  }

  return (
    <div className="section">

      {/* INFORMATIONS DE LA BOUTIQUE */}
      <div className="shop-hero">

        {shop.logo_url ? (
          <img
            src={shop.logo_url}
            alt={`Logo ${shop.name}`}
          />
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

          <p>
            {shop.description || 'Bienvenue dans notre boutique.'}
          </p>

          <small>
            <MapPin size={14} />

            {shop.zone || 'Localisation non indiquée'}
          </small>

          <div className="action-row">

            <ContactSellerButton
              shopId={shop.id}
              ownerId={shop.owner_id}
              prefill="Bonjour, je vous contacte depuis NOGAME MARKET."
            />

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

      {/* PRODUITS DE LA BOUTIQUE */}
      <section className="shop-products-section">

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
            <Store />

            <h3>Aucun produit disponible</h3>

            <p>
              Cette boutique n'a pas encore de produit actif en stock.
            </p>
          </div>
        )}

      </section>

    </div>
  );
}
