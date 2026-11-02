import { Link } from 'react-router-dom';

const NOGAME_LOGO_URL =
  'https://i.postimg.cc/HLPtsFQ6/file-0000000059a881f6ab9678fff5faea2f.png';

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${compact ? 'brand-compact' : ''}`}
      aria-label="NOGAME MARKET - Accueil"
    >
      <img
        className="brand-emblem"
        src={NOGAME_LOGO_URL}
        alt="Logo NOGAME MARKET"
        loading="eager"
        referrerPolicy="no-referrer"
      />
      <span className="brand-wordmark" aria-hidden="true">
        <strong>NOGAME</strong>
        <b>MARKET</b>
      </span>
    </Link>
  );
}
