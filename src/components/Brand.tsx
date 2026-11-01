import { Link } from "react-router-dom";

const LOGO_URL = "https://i.postimg.cc/HLPtsFQ6/file-0000000059a881f6ab9678fff5faea2f.png";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`brand ${compact ? "brand-compact" : ""}`} aria-label="NOGAME MARKET accueil">
      <img src={LOGO_URL} alt="Logo officiel NOGAME MARKET" />
      <span className="brand-name"><strong>NOGAME</strong><b>MARKET</b></span>
    </Link>
  );
}
