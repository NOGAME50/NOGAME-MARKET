import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, Eye, EyeOff, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
import type { Shop } from "../types";

interface Item { id: string; name: string; description: string | null; price: number; currency: string; stock: number; category: string | null; is_active: boolean; image_url: string | null; }

async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image illisible");
  ctx.drawImage(bmp, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Compression impossible")), "image/jpeg", 0.85));
}

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
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const load = useCallback(async () => {
    if (!supabase || !user || !id) { setLoading(false); return; }
    const s = await supabase.from("shops").select("id,owner_id,name,description,logo_url,is_active").eq("id", id).eq("owner_id", user.id).maybeSingle();
    setShop((s.data as Shop | null) ?? null);
    const p = await supabase.from("products").select("id,name,description,price,currency,stock,category,is_active,image_url").eq("shop_id", id).order("created_at", { ascending: false });
    setItems((p.data as Item[]) || []);
    setLoading(false);
  }, [id, user]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !id || !user) return;
    setBusy(true); setError("");
    let imageUrl: string | null = null;
    if (file) {
      try {
        const blob = await shrink(file);
        const path = user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
        const up = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) { setError("Envoi de l’image impossible : " + up.error.message); setBusy(false); return; }
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      } catch {
        setError("Cette image ne peut pas être lue. Choisis une photo JPG, PNG ou WEBP.");
        setBusy(false); return;
      }
    }
    const { error: err } = await supabase.from("products").insert({
      shop_id: id, name: name.trim(), description: description.trim() || null,
      price: Number(price), currency, stock: Number(stock),
      category: category.trim() || null, image_url: imageUrl, is_active: true
    });
    if (err) setError(err.message);
    else { setName(""); setDescription(""); setPrice(""); setStock("1"); setCategory(""); setFile(null); setFileKey(k => k + 1); await load(); }
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
      <label>Photo du produit<input key={fileKey} type="file" accept="image/*" onChange={e => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}/></label>
      {error && <div className="notice notice-error">{error}</div>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Enregistrement…" : "Ajouter le produit"}</button>
    </form>

    <h2 className="subheading">Mes produits ({items.length})</h2>
    {items.length ? items.map(it => <div className="shop-row" key={it.id}>
      {it.image_url ? <img src={it.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 14, objectFit: "cover" }}/> : <div className="shop-icon"><Package/></div>}
      <div><b>{it.name}</b><span>{Number(it.price).toLocaleString("fr-HT")} {it.currency} · stock : {it.stock}</span><small>{it.is_active ? "Visible" : "Masqué"}{it.category ? " · " + it.category : ""}</small></div>
      <button className="btn btn-light" onClick={() => void toggle(it)} aria-label="Afficher ou masquer">{it.is_active ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
      <button className="btn btn-light" onClick={() => void remove(it)} aria-label="Supprimer"><Trash2 size={16}/></button>
    </div>) : <div className="empty-state"><Package/><b>Aucun produit</b><span>Ajoute ton premier produit avec le formulaire ci-dessus.</span></div>}
  </div>;
}
