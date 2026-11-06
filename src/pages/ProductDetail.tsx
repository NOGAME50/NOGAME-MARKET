import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ImageOff, Store, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import ContactSellerButton from '../components/ContactSellerButton';
import LikeButton from '../components/LikeButton';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase || !id) { setLoading(false); return; }
      const { data } = await supabase
        .from('products')
        .select('id,shop_id,name,description,price,currency,stock,image_url,category,is_active,shops(id,name)')
        .eq('id', id)
        .eq('is_active', true)
        .eq('moderation_status', 'visible')
        .maybeSingle();
      if (active) { setProduct(data as Product | null); setLoading(false); }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="section">Chargement…</div>;
  if (!product) return <div className="section empty-state">Produit introuvable ou indisponible.</div>;

  const shop = Array.isArray(product.shops) ? product.shops[0] : product.shops;

  return (
    <div className="section detail-grid">
      <div className="detail-image">
        {product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="image-empty"><ImageOff />Image non disponible</div>}
      </div>
      <div>
        <span className="eyebrow">{product.category || 'PRODUIT'}</span>
        <h1>{product.name}</h1>
        <div className="product-price detail-price">{Number(product.price).toLocaleString('fr-HT')} {product.currency || 'HTG'}</div>
        <p>{product.description || 'Aucune description fournie.'}</p>
        <p className="muted">{product.stock > 0 ? `${product.stock} disponible(s)` : 'Rupture de stock'}</p>
        <div className="action-row">
          <LikeButton productId={product.id} variant="detail" />
          <ContactSellerButton shopId={product.shop_id} prefill={`Bonjour, le produit « ${product.name} » est-il toujours disponible ?`} />
          {shop && <Link className="btn btn-light" to={`/boutique/${product.shop_id}`}><Store /> Voir la boutique {shop.name}</Link>}
        </div>
        <p><Link to={`/signaler?type=product&id=${product.id}`}><Flag size={15} /> Signaler ce produit</Link></p>
      </div>
    </div>
  );
}
