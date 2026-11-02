import type { Product } from '../types';
import { Link } from 'react-router-dom';
import { ImageOff, Store } from 'lucide-react';

export default function ProductCard({
  product
}: {
  product: Product;
}) {
  const shopName = product.shops?.[0]?.name || 'Boutique';

  return (
    <article className="product-card">
      <Link
        to={`/produit/${product.id}`}
        className="product-image"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div className="image-empty">
            <ImageOff />
            <span>Image non disponible</span>
          </div>
        )}
      </Link>

      <div className="product-info">
        <span className="eyebrow">
          {product.category || 'Produit'}
        </span>

        <Link
          to={`/produit/${product.id}`}
          className="product-name"
        >
          {product.name}
        </Link>

        <div className="product-price">
          {Number(product.price).toLocaleString('fr-HT')}{' '}
          {product.currency || 'HTG'}
        </div>

        <div className="product-shop">
          <Store size={14} />
          {shopName}
        </div>

        {product.stock === 0 && (
          <small>Rupture de stock</small>
        )}
      </div>
    </article>
  );
}
