import type { Product } from '../types';
import { Link } from 'react-router-dom';
import { ImageOff, Store } from 'lucide-react';
import LikeButton from './LikeButton';

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
      </div>
      <div className="product-info">
        <span className="eyebrow">{product.category || 'Produit'}</span>
        <Link to={`/produit/${product.id}`} className="product-name">{product.name}</Link>
        <div className="product-price-row">
          <div className="product-price">{Number(product.price).toLocaleString('fr-HT')} {product.currency || 'HTG'}</div>
          <LikeButton productId={product.id} />
        </div>
        <div className="product-shop"><Store size={14} />{shop?.name || 'Boutique'}</div>
      </div>
    </article>
  );
}
