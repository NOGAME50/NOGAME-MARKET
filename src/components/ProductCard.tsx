import type { Product } from '../types';
import { Link } from 'react-router-dom';
import { ImageOff, Heart, Store, ArrowRight } from 'lucide-react';

export default function ProductCard({ product }: { product: Product }) {
  const shop = Array.isArray(product.shops) ? product.shops[0] : product.shops;

  return (
    <article className="product-card">
      <div className="product-photo-wrap">
        <Link to={`/produit/${product.id}`} className="product-image" aria-label={`Voir ${product.name}`}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} loading="lazy" />
          ) : (
            <div className="image-empty"><ImageOff /><span>Photo indisponible</span></div>
          )}
        </Link>
        <span className="product-category-badge">{product.category || 'Produit'}</span>
        <button className="product-favorite" type="button" aria-label="Ajouter aux favoris" title="Ajouter aux favoris">
          <Heart />
        </button>
      </div>
      <div className="product-info">
        <Link to={`/produit/${product.id}`} className="product-name">{product.name}</Link>
        <div className="product-price">{Number(product.price).toLocaleString('fr-HT')} {product.currency || 'HTG'}</div>
        <div className="product-bottom-row">
          <div className="product-shop"><Store size={14} /><span>{shop?.name || 'Boutique'}</span></div>
          <Link to={`/produit/${product.id}`} className="product-open-button" aria-label={`Voir ${product.name}`}>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}
