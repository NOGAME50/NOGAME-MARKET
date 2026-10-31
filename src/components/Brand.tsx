import { Link } from "react-router-dom";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`brand ${compact ? "brand-compact" : ""}`} aria-label="NOGAME MARKET accueil">
      <img src="/nogame-market-logo.png" alt="Logo officiel NOGAME MARKET" />
      <span className="brand-name"><strong>NOGAME</strong><b>MARKET</b></span>
    </Link>
  );
}
