import type { MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatLikes, toggleLike, useProductLike } from '../lib/likes';
import '../styles/likes.css';

/**
 * Bouton « J'aime » avec le nombre total de J'aime visible par tout le monde.
 * - variant « card » : petit bouton rond posé sur la photo du produit ;
 * - variant « detail » : bouton avec texte sur la page du produit.
 * Un visiteur non connecté est envoyé vers la connexion, puis revient sur la même page.
 */
export default function LikeButton({
  productId,
  variant = 'card'
}: {
  productId: string;
  variant?: 'card' | 'detail';
}) {
  const { liked, likes, loaded } = useProductLike(productId);
  const navigate = useNavigate();
  const location = useLocation();

  const onClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const result = await toggleLike(productId);
    if (result === 'auth') {
      navigate('/connexion', { state: { from: location.pathname } });
    }
  };

  const label = liked ? 'Retirer mon J’aime' : 'J’aime ce produit';
  const className = [
    'like-btn',
    variant === 'card' ? 'product-favorite like-card' : 'like-detail',
    liked ? 'is-liked' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={className} onClick={onClick} aria-pressed={liked} aria-label={label} title={label}>
      <Heart fill={liked ? 'currentColor' : 'none'} />
      {variant === 'card' ? (
        <span className="like-count">{loaded ? formatLikes(likes) : ''}</span>
      ) : (
        <span className="like-count">{loaded ? `${formatLikes(likes)} J’aime` : 'J’aime'}</span>
      )}
    </button>
  );
}
