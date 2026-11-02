import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  Store,
  Grid2X2,
  Flame,
  MapPin,
  ImageOff,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Product, Shop } from '../types';
import ProductCard from '../components/ProductCard';

const heroSlides = [
  {
    image: '/hero-market-1.png',
    alt: 'NOGAME MARKET : votre marketplace de confiance en Haïti',
    link: '/boutiques'
  },
  {
    image: '/hero-market-2.png',
    alt: 'Découvrez les boutiques et les vendeurs',
    link: '/boutiques'
  },
  {
    image: '/hero-market-3.png',
    alt: 'Découvrez les produits populaires et tendances',
    link: '/boutiques'
  },
  {
    image: '/hero-market-4.png',
    alt: 'Grossistes et bonnes affaires sur NOGAME MARKET',
    link: '/boutiques'
  }
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [currentHero, setCurrentHero] = useState(0);
  const [paused, setPaused] = useState(false);

  // Carrousel automatique
  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setCurrentHero(previous => (previous + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [paused]);

  const previousHero = () => {
    setCurrentHero(previous =>
      (previous - 1 + heroSlides.length) % heroSlides.length
    );
  };

  const nextHero = () => {
    setCurrentHero(previous =>
      (previous + 1) % heroSlides.length
    );
  };

  // Chargement des données Supabase
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

        if (!productsResult.error) {
          setProducts((productsResult.data || []) as Product[]);
        }

        if (!shopsResult.error) {
          setShops((shopsResult.data || []) as Shop[]);
        }
      } catch (error) {
        console.error(
          'Erreur de chargement de la marketplace :',
          error
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMarketplace();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();

    if (!value) return products;

    return products.filter(product =>
      `${product.name} ${product.category || ''}`
        .toLocaleLowerCase()
        .includes(value)
    );
  }, [products, query]);

  const filteredShops = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();

    if (!value) return shops;

    return shops.filter(shop =>
      `${shop.name} ${shop.zone || ''}`
        .toLocaleLowerCase()
        .includes(value)
    );
  }, [shops, query]);

  return (
    <div className="market-home">

      {/* RECHERCHE */}
      <div className="market-search-row">
        <label className="market-search">
          <Search aria-hidden="true" />

          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Rechercher une boutique ou un produit..."
            aria-label="Rechercher une boutique ou un produit"
          />

          <Link
            to="/boutiques"
            className="search-filter"
            aria-label="Voir les filtres et boutiques"
          >
            <SlidersHorizontal />
          </Link>
        </label>
      </div>

      {/* CARROUSEL HERO */}
      <section
        className="market-hero-carousel"
        aria-label="Découvrir NOGAME MARKET"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setPaused(false);
          }
        }}
      >

        <div className="hero-slides">

          {heroSlides.map((slide, index) => (
            <Link
              key={slide.image}
              to={slide.link}
              className={`hero-slide ${
                index === currentHero ? 'active' : ''
              }`}
              aria-hidden={index !== currentHero}
              tabIndex={index === currentHero ? 0 : -1}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </Link>
          ))}

        </div>

        <button
          type="button"
          className="hero-arrow hero-arrow-left"
          onClick={previousHero}
          aria-label="Bannière précédente"
        >
          <ChevronLeft />
        </button>

        <button
          type="button"
          className="hero-arrow hero-arrow-right"
          onClick={nextHero}
          aria-label="Bannière suivante"
        >
          <ChevronRight />
        </button>

        <div className="hero-pagination">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              className={index === currentHero ? 'active' : ''}
              onClick={() => setCurrentHero(index)}
              aria-label={`Afficher la bannière ${index + 1}`}
              aria-current={index === currentHero ? 'true' : undefined}
            />
          ))}
        </div>

      </section>

      {/* ACCÈS RAPIDES */}
      <section
        className="market-shortcuts"
        aria-label="Accès rapides"
      >
        <Link to="/boutiques">
          <Store />
          <b>Boutiques</b>
        </Link>

        <a href="#produits">
          <Grid2X2 />
          <b>Catégories</b>
        </a>

        <a href="#produits">
          <Flame />
          <b>Populaires</b>
        </a>

        <Link to="/boutiques">
          <MapPin />
          <b>Près de moi</b>
        </Link>
      </section>

      {/* BOUTIQUES POPULAIRES */}
      <section className="market-section" id="boutiques">

        <div className="market-section-heading">
          <h2>
            <span className="heading-marker" />
            Boutiques populaires
          </h2>

          <Link to="/boutiques">
            Voir tout <ArrowRight />
          </Link>
        </div>

        {filteredShops.length > 0 ? (
          <div className="shop-carousel">

            {filteredShops.map(shop => (
              <article
                className="popular-shop-card"
                key={shop.id}
              >
                <Link
                  to={`/boutique/${shop.id}`}
                  className="popular-shop-main"
                >
                  {shop.logo_url ? (
                    <img
                      className="popular-shop-logo"
                      src={shop.logo_url}
                      alt={`Logo ${shop.name}`}
                      loading="lazy"
                    />
                  ) : (
                    <span className="popular-shop-placeholder">
                      <Store />
                    </span>
                  )}

                  <b>{shop.name}</b>

                  <small>
                    {shop.zone || 'Boutique en Haïti'}
                  </small>
                </Link>

                <Link
                  to={`/boutique/${shop.id}`}
                  className="shop-follow-button"
                >
                  Voir la boutique
                </Link>
              </article>
            ))}

          </div>
        ) : (
          <div className="market-empty">
            <Store />

            <b>
              {loading
                ? 'Chargement des boutiques…'
                : 'Aucune boutique disponible pour le moment.'}
            </b>

            <span>
              Les boutiques actives apparaîtront ici dès qu'elles seront publiées.
            </span>
          </div>
        )}

      </section>

      {/* PRODUITS TENDANCE */}
      <section className="market-section" id="produits">

        <div className="market-section-heading">
          <h2>
            <span className="heading-marker" />
            Produits tendance
          </h2>

          <Link to="/boutiques">
            Voir tout <ArrowRight />
          </Link>
        </div>

        {!isSupabaseConfigured && (
          <div className="market-empty">
            <ImageOff />

            <b>Connexion à la marketplace indisponible.</b>

            <span>
              La configuration Supabase est nécessaire pour afficher les produits.
            </span>
          </div>
        )}

        {filteredProducts.length > 0 ? (
          <div className="trending-products">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : isSupabaseConfigured ? (
          <div className="market-empty">
            <ImageOff />

            <b>
              {loading
                ? 'Chargement des produits…'
                : 'Aucun produit disponible pour le moment.'}
            </b>

            <span>
              Les produits actifs avec du stock apparaîtront dans cette section.
            </span>
          </div>
        ) : null}

      </section>

    </div>
  );
                           }
