import { Link } from "react-router-dom";
import { Store, MapPin, Phone } from "lucide-react";
import type { Shop } from "../types";
import { formatDistance } from "../lib/utils";

export default function ShopCard({ shop, km }: { shop: Shop; km: number | null }) {
  return <Link to={`/boutique/${shop.id}`} className="shop-row" style={{ margin: "10px 0" }}>
    {shop.logo_url ? <img src={shop.logo_url} alt="" style={{ width: 48, height: 48, borderRadius: 14, objectFit: "cover" }}/> : <div className="shop-icon"><Store/></div>}
    <div>
      <b>{shop.name}</b>
      <span>{shop.description || "Boutique NOGAME MARKET"}</span>
      <small style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <MapPin size={12}/>{[shop.zone, km !== null ? formatDistance(km) : null].filter(Boolean).join(" · ") || "Position non indiquée"}
        {shop.phone ? <><Phone size={12}/>{shop.phone}</> : null}
      </small>
    </div>
  </Link>;
}
