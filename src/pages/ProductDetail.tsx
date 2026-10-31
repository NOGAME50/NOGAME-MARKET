import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ImageOff, Store } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";
export default function ProductDetail(){const {id}=useParams();const [p,setP]=useState<Product|null>(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!supabase||!id){setLoading(false);return;}supabase.from("products").select("id,shop_id,name,description,price,currency,stock,image_url,category,shops(id,name)").eq("id",id).eq("is_active",true).maybeSingle().then(({data})=>{setP(data as unknown as Product|null);setLoading(false);});},[id]);
 if(loading)return <div className="page-loading">Chargement…</div>;
 if(!p)return <div className="section narrow"><h1>Produit introuvable</h1><p className="muted">Ce produit n’est pas disponible ou n’est plus publié.</p><Link to="/" className="btn btn-primary"><ArrowLeft/>Retour</Link></div>;
 return <div className="section detail-grid"><div className="detail-image">{p.image_url?<img src={p.image_url} alt={p.name}/>:<ImageOff/>}</div><div><span className="eyebrow">{p.category||"Produit"}</span><h1>{p.name}</h1><div className="detail-price">{p.price.toLocaleString("fr-HT")} {p.currency}</div><p className="muted">{p.description||"Aucune description fournie."}</p><p className="product-shop"><Store/>{p.shops?.name}</p><div className="notice">Le parcours de panier et de commande sera activé après l’ajout du module de commandes sécurisé.</div><Link to="/" className="text-link"><ArrowLeft/> Retour aux produits</Link></div></div>;
}
