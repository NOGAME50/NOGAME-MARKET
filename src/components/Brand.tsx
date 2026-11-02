import { Link } from 'react-router-dom';

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="NOGAME MARKET - Accueil">
      <img className="brand-emblem" src="/nogame-market-emblem.png" alt="" />
      <span className="brand-wordmark" aria-hidden="true">
        <strong>NOGAME</strong>
        <b>MARKET</b>
      </span>
    </Link>
  );
}
