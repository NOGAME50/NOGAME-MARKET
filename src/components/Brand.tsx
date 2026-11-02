import { Link } from 'react-router-dom';

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${compact ? 'brand-compact' : ''}`}
      aria-label="NOGAME MARKET - Accueil"
    >
      <img src="/logo-nogame-market.svg" alt="NOGAME MARKET" />
    </Link>
  );
}
