import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import type { Shop } from "../types";
import { formatDistance } from "../lib/utils";

export default function ShopRound({ shop, km }: { shop: Shop; km: number | null }) {
  return <Link to={`/boutique/${shop.id}`} className="nm-shop">
    {shop.logo_url ? <img className="nm-shop-logo" src={shop.logo_url} alt=""/> : <span className="nm-shop-logo"><Store size={34}/></span>}
    <b>{shop.name}</b>
    <small>{km !== null ? formatDistance(km) : shop.zone || "Boutique locale"}</small>
    <span className="nm-follow">Voir la boutique</span>
  </Link>;
}
