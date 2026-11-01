import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, Eye, EyeOff, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import type { Shop } from "../types";

interface Item { id: string; name: string; description: string | null; price: number; currency: string; stock: number; category: string | null; is_active: boolean; }

export default function ShopManage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("HTG");
  const [stock, setStock] = useState("1");
  const [category, setCategory] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !user || !id) { setLoading(false); return; }
    const s = await supabase.from("shops").select("id,owner_id,name,description,logo_url,is_active").eq("id", id).eq("owner_id", user.id).maybeSingle();
    setShop((s.data as Shop | null) ?? null);
    const p = await supabase.from("products").select("id,name,description,price,currency,stock,category,is_active").eq("shop_id", id).order("created_at", { ascending: false });
    setItems((p.data as Item[]) || []);
    setLoading(false);
  }, [id, user]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !id) return;
    setBusy(true); setError("");
    const { error: err } = await supabase.from("products").insert({
      shop_id: id, name: name.trim(), description: description.trim() || null,
      price: Number(price), currency, stock: Number(stock),
      category: category.trim() || null, is_active: true
    });
    if (err) setError(err.message);
    else { setName(""); setDescription(""); setPrice(""); setStock("1"); setCategory(""); await load(); }
    setBusy(false);
  };

  const toggle = async (it: Item) => {
    if (!supabase) return;
    setError("");
    const { error: err } = await supabase.from("products").update({ is_active: !it.is_active }).eq("id", it.id);
    if (err) setError(err.message); else await load();
  };

  const remove = async (it: Item) => {
    if (!supabase || !window.confirm("Supprimer « " + it.name + " » ?")) return;
    setError("");
    const { data, error: err } = await supabase.from("products").delete().eq("id", it.id).select("id");
    if (err || !data || !data.length) setError("Suppression impossible. L’autorisation de suppression n’est pas encore activée dans Supabase.");
    else await load();
  };

  if (loading) return <div className="page-loading">Chargement…</div>;
  if (!shop) return <div className="section narrow"><h1>Boutique introuvable</h1><Link to="/vendeur" className="btn btn-primary"><ArrowLeft/>Retour</Link></div>;

  return <div className="section narrow">
    <Link to="/vendeur" className="text-link"><ArrowLeft size={16}/> Centre vendeur</Link>
    <h1>{shop.name}</h1>
    {!shop.is_active && <div className="notice">Ta boutique est en attente d’activation. Tes produits seront visibles sur l’accueil dès qu’elle sera validée.</div>}

    <h2 className="subheading">Ajouter un produit</h2>
    <form className="form-stack panel" onSubmit={submit}>
      <label>Nom du produit<input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Robe en coton"/></label>
      <label>Description<textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Taille, couleur, état, détails…"/></label>
      <label>Prix<input required type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ex : 1500"/></label>
      <label>Devise<select value={currency} onChange={e => setCurrency(e.target.value)}><option value="HTG">HTG (gourdes)</option><option value="USD">USD (dollars)</option></select></label>
      <label>Quantité en stock<input required type="number" min="0" step="1" inputMode="numeric" value={stock} onChange={e => setStock(e.target.value)}/></label>
      <label>Catégorie<input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex : Vêtements"/></label>
      {error && <div className="notice notice-error">{error}</div>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Enregistrement…" : "Ajouter le produit"}</button>
    </form>

    <h2 className="subheading">Mes produits ({items.length})</h2>
    {items.length ? items.map(it => <div className="shop-row" key={it.id}>
      <div className="shop-icon"><Package/></div>
      <div><b>{it.name}</b><span>{Number(it.price).toLocaleString("fr-HT")} {it.currency} · stock : {it.stock}</span><small>{it.is_active ? "Visible" : "Masqué"}{it.category ? " · " + it.category : ""}</small></div>
      <button className="btn btn-light" onClick={() => void toggle(it)} aria-label="Afficher ou masquer">{it.is_active ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
      <button className="btn btn-light" onClick={() => void remove(it)} aria-label="Supprimer"><Trash2 size={16}/></button>
    </div>) : <div className="empty-state"><Package/><b>Aucun produit</b><span>Ajoute ton premier produit avec le formulaire ci-dessus.</span></div>}
  </div>;
}
