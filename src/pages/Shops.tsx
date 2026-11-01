import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, Store } from "lucide-react";
import ShopCard from "../components/ShopCard";
import { supabase } from "../lib/supabase";
import { autoPosition, getPosition, rankShops } from "../lib/utils";
import type { Coords } from "../lib/utils";
import type { Shop } from "../types";

export default function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [here, setHere] = useState<Coords | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let ok = true;
    const load = async () => {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.from("shops")
        .select("id,owner_id,name,description,logo_url,is_active,phone,latitude,longitude,zone")
        .eq("is_active", true).order("created_at", { ascending: false }).limit(300);
      if (ok) { setShops((data as Shop[]) || []); setLoading(false); }
    };
    void load();
    void autoPosition().then(p => { if (ok && p) setHere(p); });
    return () => { ok = false; };
  }, []);

  const locate = async () => {
    setLocating(true); setGeoMsg("");
    try { setHere(await getPosition()); }
    catch (e) { setGeoMsg(e instanceof Error ? e.message : "Position indisponible."); }
    setLocating(false);
  };

  const list = useMemo(
    () => rankShops(shops.filter(s => (s.name + " " + (s.zone || "")).toLowerCase().includes(query.trim().toLowerCase())), here),
    [shops, query, here]
  );

  return <div className="section narrow">
    <span className="eyebrow">DÉCOUVRIR</span>
    <h1>Boutiques</h1>
    <p className="muted">{here ? "Triées de la plus proche à la plus éloignée." : "Active ta position pour voir les boutiques les plus proches de toi."}</p>
    <label className="search-box"><Search/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une boutique ou une zone…"/></label>
    <button className="btn btn-light" style={{ border: "1px solid #dfe6ee" }} onClick={() => void locate()} disabled={locating}><MapPin size={16}/>{locating ? "Recherche de ta position…" : here ? "Position activée" : "Boutiques près de moi"}</button>
    {geoMsg && <div className="notice notice-error">{geoMsg}</div>}
    {loading ? <div className="empty-state">Chargement…</div> : list.length
      ? list.map(x => <ShopCard key={x.shop.id} shop={x.shop} km={x.km}/>)
      : <div className="empty-state"><Store/><b>Aucune boutique trouvée</b><span>Essaie un autre nom, ou reviens plus tard.</span></div>}
  </div>;
}
